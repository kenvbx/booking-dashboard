<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StaffResource;
use App\Models\StaffProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StaffController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return StaffResource::collection(StaffProfile::query()->where('is_active', true)->orderBy('display_name')->get());
    }

    public function store(Request $request): StaffResource
    {
        $staff = StaffProfile::create($request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id', 'unique:staff_profiles,user_id'],
            'display_name' => ['required', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:32'],
            'color' => ['nullable', 'string', 'max:32'],
            'is_active' => ['sometimes', 'boolean'],
        ]));

        return new StaffResource($staff);
    }

    public function show(StaffProfile $staff): StaffResource
    {
        return new StaffResource($staff);
    }
}
