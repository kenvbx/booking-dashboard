<?php

namespace Tests\Feature;

use App\Jobs\SendAppointmentConfirmation;
use App\Jobs\SendAppointmentReminder;
use App\Mail\AppointmentConfirmationMail;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Service;
use App\Models\StaffProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class BookingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_appointments_can_be_created_and_listed(): void
    {
        [$actor, $staff] = $this->signInStaff();
        $customer = Customer::factory()->create();
        $service = Service::factory()->create();

        $response = $this->postJson('/api/appointments', [
            'customer_id' => $customer->id,
            'service_id' => $service->id,
            'staff_profile_id' => $staff->id,
            'title' => 'Discovery call',
            'starts_at' => '2026-11-16T09:00:00+07:00',
            'ends_at' => '2026-11-16T09:45:00+07:00',
        ]);

        $response->assertCreated()->assertJsonPath('data.title', 'Discovery call');
        $this->getJson('/api/appointments')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_appointments_accept_a_bounded_page_size(): void
    {
        $this->signInStaff();

        $this->getJson('/api/appointments?per_page=1')
            ->assertOk()
            ->assertJsonPath('meta.per_page', 1);
    }

    public function test_appointment_on_the_end_date_is_included_in_date_range(): void
    {
        [, $staff] = $this->signInStaff();
        $appointment = Appointment::factory()->create([
            'staff_profile_id' => $staff->id,
            'starts_at' => '2026-11-16 16:00:00',
            'ends_at' => '2026-11-16 16:45:00',
        ]);

        $this->getJson('/api/appointments?from=2026-11-16&to=2026-11-16')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $appointment->id);
    }

    public function test_overlapping_appointments_for_the_same_staff_are_rejected(): void
    {
        [, $staff] = $this->signInStaff();
        $customer = Customer::factory()->create();
        $payload = [
            'customer_id' => $customer->id,
            'staff_profile_id' => $staff->id,
            'title' => 'First booking',
            'starts_at' => '2026-11-16T09:00:00+07:00',
            'ends_at' => '2026-11-16T10:00:00+07:00',
        ];

        $this->postJson('/api/appointments', $payload)->assertCreated();
        $this->postJson('/api/appointments', [...$payload, 'title' => 'Overlapping booking', 'starts_at' => '2026-11-16T09:30:00+07:00'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('starts_at');
    }

    public function test_customer_creation_validates_email_uniqueness(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']), 'sanctum');
        Customer::factory()->create(['email' => 'hello@example.test']);

        $this->postJson('/api/customers', ['name' => 'Duplicate', 'email' => 'hello@example.test'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_retrying_with_the_same_idempotency_key_returns_the_original_appointment(): void
    {
        [, $staff] = $this->signInStaff();
        $customer = Customer::factory()->create();
        $payload = [
            'customer_id' => $customer->id,
            'staff_profile_id' => $staff->id,
            'title' => 'Retry-safe booking',
            'starts_at' => '2026-11-17T09:00:00+07:00',
            'ends_at' => '2026-11-17T09:45:00+07:00',
            'idempotency_key' => 'booking-demo-001',
        ];

        $first = $this->postJson('/api/appointments', $payload)->assertCreated();
        $second = $this->postJson('/api/appointments', [...$payload, 'title' => 'Retried payload'])->assertOk();

        $this->assertSame($first->json('data.id'), $second->json('data.id'));
        $this->assertDatabaseCount('appointments', 1);
    }

    public function test_status_transitions_are_validated_and_recorded(): void
    {
        [$actor, $staff] = $this->signInStaff();
        $appointment = Appointment::factory()->create(['status' => 'pending', 'staff_profile_id' => $staff->id]);

        $this->patchJson('/api/appointments/'.$appointment->id, ['status' => 'confirmed'])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed');
        $this->assertDatabaseHas('appointment_status_histories', [
            'appointment_id' => $appointment->id,
            'from_status' => 'pending',
            'to_status' => 'confirmed',
            'changed_by' => $actor->id,
        ]);

        $this->patchJson('/api/appointments/'.$appointment->id, ['status' => 'cancelled'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status_reason');
        $this->patchJson('/api/appointments/'.$appointment->id, ['status' => 'cancelled', 'status_reason' => 'Customer requested cancellation'])
            ->assertOk();
        $this->patchJson('/api/appointments/'.$appointment->id, ['status' => 'confirmed'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');
    }

    public function test_admin_can_edit_resources_and_deactivate_staff(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']), 'sanctum');
        $customer = Customer::factory()->create(['name' => 'Old name']);
        $service = Service::factory()->create(['name' => 'Old service']);
        $staff = StaffProfile::factory()->create(['display_name' => 'Old staff']);

        $this->patchJson('/api/customers/'.$customer->id, ['name' => 'Updated customer'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated customer');
        $this->patchJson('/api/services/'.$service->id, ['name' => 'Updated service', 'duration_minutes' => 60])
            ->assertOk()
            ->assertJsonPath('data.duration_minutes', 60);
        $this->patchJson('/api/staff/'.$staff->id, ['display_name' => 'Updated staff'])
            ->assertOk()
            ->assertJsonPath('data.display_name', 'Updated staff');
        $this->deleteJson('/api/staff/'.$staff->id)
            ->assertNoContent();

        $this->assertDatabaseHas('staff_profiles', ['id' => $staff->id, 'is_active' => false]);
    }

    public function test_staff_can_edit_and_cancel_an_appointment(): void
    {
        [, $staff] = $this->signInStaff();
        $appointment = Appointment::factory()->create(['status' => 'confirmed', 'staff_profile_id' => $staff->id]);

        $this->patchJson('/api/appointments/'.$appointment->id, ['title' => 'Rescheduled title'])
            ->assertOk()
            ->assertJsonPath('data.title', 'Rescheduled title');
        $this->deleteJson('/api/appointments/'.$appointment->id, ['reason' => 'Customer requested cancellation'])
            ->assertNoContent();

        $this->assertDatabaseHas('appointments', ['id' => $appointment->id, 'status' => 'cancelled']);
    }

    public function test_staff_cannot_reassign_an_appointment_to_another_staff_member(): void
    {
        [, $staff] = $this->signInStaff();
        $otherStaff = StaffProfile::factory()->create();
        $appointment = Appointment::factory()->create(['staff_profile_id' => $staff->id]);

        $this->patchJson('/api/appointments/'.$appointment->id, [
            'staff_profile_id' => $otherStaff->id,
        ])->assertForbidden();

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'staff_profile_id' => $staff->id,
        ]);
    }

    public function test_staff_cannot_view_another_staff_members_appointment(): void
    {
        $this->signInStaff();
        $otherStaff = StaffProfile::factory()->create();
        $appointment = Appointment::factory()->create(['staff_profile_id' => $otherStaff->id]);

        $this->getJson('/api/appointments/'.$appointment->id)->assertForbidden();
    }

    public function test_future_appointment_queues_confirmation_and_reminder(): void
    {
        Queue::fake();
        [, $staff] = $this->signInStaff();
        $customer = Customer::factory()->create();

        $this->postJson('/api/appointments', [
            'customer_id' => $customer->id,
            'staff_profile_id' => $staff->id,
            'title' => 'Queued appointment',
            'starts_at' => '2026-11-18T09:00:00+07:00',
            'ends_at' => '2026-11-18T09:45:00+07:00',
        ])->assertCreated();

        Queue::assertPushed(SendAppointmentConfirmation::class);
        Queue::assertPushed(SendAppointmentReminder::class);
    }

    public function test_confirmation_job_sends_to_the_customer_email(): void
    {
        Mail::fake();
        $appointment = Appointment::factory()->create();

        (new SendAppointmentConfirmation($appointment->id))->handle();

        Mail::assertSent(AppointmentConfirmationMail::class, function (AppointmentConfirmationMail $mail) use ($appointment): bool {
            return $mail->hasTo($appointment->customer->email);
        });
    }

    public function test_important_appointment_actions_create_audit_logs(): void
    {
        [$actor, $staff] = $this->signInStaff();
        $appointment = Appointment::factory()->create(['status' => 'confirmed', 'staff_profile_id' => $staff->id]);

        $this->patchJson('/api/appointments/'.$appointment->id, ['title' => 'Updated title'])->assertOk();
        $this->deleteJson('/api/appointments/'.$appointment->id, ['reason' => 'Customer requested cancellation'])->assertNoContent();

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $actor->id,
            'action' => 'appointment.updated',
            'auditable_id' => $appointment->id,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $actor->id,
            'action' => 'appointment.cancelled',
            'auditable_id' => $appointment->id,
        ]);
    }

    public function test_staff_can_read_dashboard_metrics(): void
    {
        [, $staff] = $this->signInStaff();
        Appointment::factory()->create(['status' => 'completed', 'staff_profile_id' => $staff->id]);
        Customer::factory()->create();

        $this->getJson('/api/dashboard/metrics')
            ->assertOk()
            ->assertJsonStructure(['data' => ['total_bookings', 'upcoming_today', 'completion_rate', 'new_customers', 'timezone', 'generated_at']])
            ->assertJsonPath('data.total_bookings', 1)
            ->assertJsonPath('data.completion_rate', 100);
    }

    /** @return array{0: User, 1: StaffProfile} */
    private function signInStaff(): array
    {
        $user = User::factory()->create(['role' => 'staff']);
        $staff = StaffProfile::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user, 'sanctum');

        return [$user, $staff];
    }
}
