<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\StaffProfile;
use Carbon\Carbon;
use Illuminate\Database\DatabaseManager;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class AppointmentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $appointments = Appointment::query()
            ->with(['customer', 'service', 'staff'])
            ->when($request->filled('staff_profile_id'), fn ($query) => $query->where('staff_profile_id', $request->integer('staff_profile_id')))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('from'), fn ($query) => $query->where('starts_at', '>=', $request->date('from')))
            ->when($request->filled('to'), fn ($query) => $query->where('ends_at', '<=', $request->date('to')))
            ->orderBy('starts_at')
            ->paginate(50);

        return AppointmentResource::collection($appointments);
    }

    public function store(Request $request, DatabaseManager $database): AppointmentResource
    {
        $data = $request->validate($this->rules());
        $data['timezone'] ??= config('app.timezone', 'Asia/Ho_Chi_Minh');
        $data['status'] ??= 'pending';

        $appointment = $database->transaction(function () use ($data): Appointment {
            StaffProfile::query()->whereKey($data['staff_profile_id'])->lockForUpdate()->firstOrFail();

            if (! empty($data['idempotency_key'])) {
                $existing = Appointment::query()->where('idempotency_key', $data['idempotency_key'])->first();

                if ($existing) {
                    return $existing;
                }
            }

            $this->ensureNoConflict($data);
            $appointment = Appointment::create($data);
            $appointment->statusHistory()->create(['to_status' => $appointment->status]);

            return $appointment;
        });

        return new AppointmentResource($appointment->load(['customer', 'service', 'staff']));
    }

    public function show(Appointment $appointment): AppointmentResource
    {
        return new AppointmentResource($appointment->load(['customer', 'service', 'staff', 'statusHistory']));
    }

    public function update(Request $request, Appointment $appointment, DatabaseManager $database): AppointmentResource
    {
        $data = $request->validate($this->rules(true));
        $database->transaction(function () use ($appointment, $data): void {
            if (isset($data['starts_at']) || isset($data['ends_at']) || isset($data['staff_profile_id'])) {
                $booking = array_merge($appointment->only(['staff_profile_id', 'starts_at', 'ends_at']), $data);
                StaffProfile::query()->whereKey($booking['staff_profile_id'])->lockForUpdate()->firstOrFail();
                $this->ensureNoConflict($booking, $appointment->id);
            }
            $oldStatus = $appointment->status;
            $appointment->update($data);
            if (isset($data['status']) && $oldStatus !== $data['status']) {
                $appointment->statusHistory()->create(['from_status' => $oldStatus, 'to_status' => $data['status']]);
            }
        });

        return new AppointmentResource($appointment->refresh()->load(['customer', 'service', 'staff']));
    }

    public function destroy(Appointment $appointment): Response
    {
        $appointment->update(['status' => 'cancelled']);

        return response()->noContent();
    }

    private function rules(bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return [
            'customer_id' => [$required, 'integer', 'exists:customers,id'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
            'staff_profile_id' => [$required, 'integer', 'exists:staff_profiles,id'],
            'title' => [$required, 'string', 'max:180'],
            'starts_at' => [$required, 'date'],
            'ends_at' => [$required, 'date', 'after:starts_at'],
            'status' => ['sometimes', 'in:pending,confirmed,cancelled,completed,rescheduled'],
            'timezone' => ['sometimes', 'timezone'],
            'idempotency_key' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string'],
        ];
    }

    private function ensureNoConflict(array $data, ?int $ignoreId = null): void
    {
        $startsAt = Carbon::parse($data['starts_at']);
        $endsAt = Carbon::parse($data['ends_at']);
        $conflict = Appointment::query()
            ->where('staff_profile_id', $data['staff_profile_id'])
            ->whereNotIn('status', ['cancelled'])
            ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
            ->where('starts_at', '<', $endsAt)
            ->where('ends_at', '>', $startsAt)
            ->exists();

        if ($conflict) {
            throw ValidationException::withMessages(['starts_at' => 'This staff member already has an overlapping appointment.']);
        }
    }
}
