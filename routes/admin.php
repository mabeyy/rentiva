<?php

use App\Http\Controllers\Admin\ActivityController;
use App\Http\Controllers\Admin\BillingController;
use App\Http\Controllers\Admin\BookingController;
use App\Http\Controllers\Admin\CarController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\FeatureController;
use App\Http\Controllers\Admin\ImpersonationController;
use App\Http\Controllers\Admin\LessorController;
use App\Http\Controllers\Admin\LessorRetentionController;
use App\Http\Controllers\Admin\LessorSubscriptionController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\PlanController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Lessor\ConnectionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');
        Route::get('activity', ActivityController::class)->name('activity');

        Route::resource('lessors', LessorController::class)->only(['index', 'show', 'update']);
        Route::put('lessors/{lessor}/retention', LessorRetentionController::class)->name('lessors.retention.update');

        // Admins can set up an owner's email, SMS and calendar on their behalf.
        Route::prefix('lessors/{lessor}/connections')->name('lessors.connections.')->controller(ConnectionController::class)->group(function () {
            Route::get('email', 'email')->name('email');
            Route::put('email', 'updateEmail')->name('email.update');
            Route::post('email/test', 'testEmail')->middleware('throttle:6,1')->name('email.test');
            Route::get('sms', 'sms')->name('sms');
            Route::put('sms', 'updateSms')->name('sms.update');
            Route::post('sms/test', 'testSms')->middleware('throttle:6,1')->name('sms.test');
            Route::get('calendar', 'calendar')->name('calendar');
            Route::put('calendar', 'updateCalendar')->name('calendar.update');
            Route::post('calendar/test', 'testCalendar')->middleware('throttle:6,1')->name('calendar.test');
            Route::put('reminders', 'updateReminders')->name('reminders.update');
            Route::get('deliveries', 'deliveries')->name('deliveries');
        });
        Route::resource('cars', CarController::class)->only(['index', 'show', 'update']);
        Route::get('bookings', [BookingController::class, 'index'])->name('bookings.index');
        Route::resource('features', FeatureController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::get('settings', [SettingController::class, 'edit'])->name('settings.edit');
        Route::resource('plans', PlanController::class)->only(['index', 'store', 'update']);
        Route::get('billing', [BillingController::class, 'index'])->name('billing.index');
        Route::put('billing/accounts', [BillingController::class, 'updateAccounts'])->name('billing.accounts.update');
        Route::put('billing/grace', [BillingController::class, 'updateGrace'])->name('billing.grace.update');
        Route::put('lessors/{lessor}/subscription', LessorSubscriptionController::class)->name('lessors.subscription.update');
        Route::post('lessors/{lessor}/impersonate', [ImpersonationController::class, 'store'])->name('lessors.impersonate');
        Route::get('notifications/{notification}', [NotificationController::class, 'show'])->name('notifications.show');
        Route::post('notifications/read', [NotificationController::class, 'readAll'])->name('notifications.read');
        Route::put('billing/invoices/{invoice}', [BillingController::class, 'review'])->name('billing.invoices.review');
        Route::get('billing/invoices/{invoice}/proof', [BillingController::class, 'proof'])->name('billing.invoices.proof');
        Route::put('settings', [SettingController::class, 'update'])->name('settings.update');
        Route::put('settings/support', [SettingController::class, 'updateSupport'])->name('settings.support.update');
    });
