<?php

use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\StaffController;
use Illuminate\Support\Facades\Route;

Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:login');

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function (): void {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    Route::middleware('role:admin')->group(function (): void {
        Route::apiResource('customers', CustomerController::class);
        Route::apiResource('services', ServiceController::class);
        Route::apiResource('staff', StaffController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
    });

    Route::middleware('role:admin,staff')->group(function (): void {
        Route::get('dashboard/metrics', [DashboardController::class, 'metrics']);
        Route::apiResource('appointments', AppointmentController::class);
    });
});
