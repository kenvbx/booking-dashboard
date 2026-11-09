<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Service;
use App\Models\StaffProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_appointments_can_be_created_and_listed(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'staff']), 'sanctum');
        $customer = Customer::factory()->create();
        $service = Service::factory()->create();
        $staff = StaffProfile::factory()->create();

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

    public function test_overlapping_appointments_for_the_same_staff_are_rejected(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'staff']), 'sanctum');
        $customer = Customer::factory()->create();
        $staff = StaffProfile::factory()->create();
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
        $this->actingAs(User::factory()->create(['role' => 'staff']), 'sanctum');
        $customer = Customer::factory()->create();
        $staff = StaffProfile::factory()->create();
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
}
