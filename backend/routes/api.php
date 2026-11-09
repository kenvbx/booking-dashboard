<?php

use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\StaffController;
use Illuminate\Support\Facades\Route;

Route::apiResource('customers', CustomerController::class);
Route::apiResource('services', ServiceController::class);
Route::apiResource('staff', StaffController::class)->only(['index', 'store', 'show']);
Route::apiResource('appointments', AppointmentController::class);
