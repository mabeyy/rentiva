<?php

use App\Http\Controllers\Lessor\ActivityController;
use App\Http\Controllers\Lessor\BillingController;
use App\Http\Controllers\Lessor\BookingChangeController;
use App\Http\Controllers\Lessor\BookingChangeRequestController;
use App\Http\Controllers\Lessor\BookingChargeController;
use App\Http\Controllers\Lessor\BookingController;
use App\Http\Controllers\Lessor\BookingDepositController;
use App\Http\Controllers\Lessor\BookingDocumentController;
use App\Http\Controllers\Lessor\BookingInspectionController;
use App\Http\Controllers\Lessor\BookingLicenseController;
use App\Http\Controllers\Lessor\BookingPaymentController;
use App\Http\Controllers\Lessor\BookingRefundController;
use App\Http\Controllers\Lessor\CarActivationController;
use App\Http\Controllers\Lessor\CarBlockController;
use App\Http\Controllers\Lessor\CarController;
use App\Http\Controllers\Lessor\CarServiceController;
use App\Http\Controllers\Lessor\CarSubmissionController;
use App\Http\Controllers\Lessor\ConnectionController;
use App\Http\Controllers\Lessor\DashboardController;
use App\Http\Controllers\Lessor\ExportController;
use App\Http\Controllers\Lessor\HelpController;
use App\Http\Controllers\Lessor\MainPickupLocationController;
use App\Http\Controllers\Lessor\ManualBookingController;
use App\Http\Controllers\Lessor\NotificationController;
use App\Http\Controllers\Lessor\PaymentSettingController;
use App\Http\Controllers\Lessor\PeakSeasonController;
use App\Http\Controllers\Lessor\PickupLocationController;
use App\Http\Controllers\Lessor\PolicyController;
use App\Http\Controllers\Lessor\RenterController;
use App\Http\Controllers\Lessor\RevenueController;
use App\Http\Controllers\Lessor\ReviewController;
use App\Http\Controllers\Lessor\StorefrontController;
use App\Http\Controllers\Lessor\TeamController;
use App\Http\Controllers\Lessor\TransferController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'workspace', 'role:lessor'])
    ->prefix('lessor')
    ->name('lessor.')
    ->group(function () {
        // Everyone on the team.
        Route::get('dashboard', DashboardController::class)->name('dashboard');
        Route::get('activity', ActivityController::class)->name('activity');
        Route::get('help', HelpController::class)->name('help');
        Route::get('notifications/{notification}', [NotificationController::class, 'show'])->name('notifications.show');
        Route::post('notifications/read', [NotificationController::class, 'readAll'])->name('notifications.read');

        Route::middleware('permission:bookings')->group(function () {
            Route::get('bookings', [BookingController::class, 'index'])->name('bookings.index');
            Route::get('bookings/export', [ExportController::class, 'bookings'])->name('bookings.export');
            Route::get('bookings/calendar', [BookingController::class, 'calendar'])->name('bookings.calendar');
            Route::get('bookings/blocked', [CarBlockController::class, 'index'])->name('bookings.blocked');
            Route::get('bookings/create', [ManualBookingController::class, 'create'])->name('bookings.create');
            Route::post('bookings', [ManualBookingController::class, 'store'])->name('bookings.store');
            Route::get('bookings/{booking}', [BookingController::class, 'show'])->name('bookings.show');
            Route::patch('bookings/{booking}', [BookingController::class, 'update'])->name('bookings.update');
            Route::get('bookings/{booking}/license', [BookingLicenseController::class, 'show'])->name('bookings.license.show');
            Route::put('bookings/{booking}/license', [BookingLicenseController::class, 'update'])->name('bookings.license.update');
            Route::get('bookings/{booking}/receipt', [BookingDocumentController::class, 'receipt'])->name('bookings.receipt');
            Route::get('bookings/{booking}/agreement', [BookingDocumentController::class, 'agreement'])->name('bookings.agreement');
            Route::put('bookings/{booking}/trip', [BookingChangeController::class, 'update'])->name('bookings.trip.update');
            Route::post('bookings/{booking}/charges', [BookingChargeController::class, 'store'])->name('bookings.charges.store');
            Route::delete('bookings/{booking}/charges/{charge}', [BookingChargeController::class, 'destroy'])->name('bookings.charges.destroy');
            Route::put('bookings/{booking}/deposit', [BookingDepositController::class, 'update'])->name('bookings.deposit.update');
            Route::post('bookings/{booking}/inspections', [BookingInspectionController::class, 'store'])->name('bookings.inspections.store');
            Route::put('bookings/{booking}/refund', [BookingRefundController::class, 'update'])->name('bookings.refund.update');
            Route::post('bookings/{booking}/change-request/approve', [BookingChangeRequestController::class, 'approve'])->name('bookings.change-request.approve');
            Route::post('bookings/{booking}/change-request/decline', [BookingChangeRequestController::class, 'decline'])->name('bookings.change-request.decline');
            Route::get('bookings/{booking}/inspections/{inspection}/photos/{index}', [BookingInspectionController::class, 'photo'])->name('bookings.inspections.photo')->whereNumber('index');
        });

        Route::middleware('permission:cars')->group(function () {
            Route::resource('cars', CarController::class)->except('show');
            Route::post('cars/{car}/submission', [CarSubmissionController::class, 'store'])->name('cars.submission.store');
            Route::put('cars/{car}/activation', [CarActivationController::class, 'update'])->name('cars.activation.update');
            Route::post('cars/{car}/services', [CarServiceController::class, 'store'])->name('cars.services.store');
            Route::delete('cars/{car}/services/{service}', [CarServiceController::class, 'destroy'])->name('cars.services.destroy');
            Route::scopeBindings()->controller(CarBlockController::class)->name('cars.blocks.')->group(function () {
                Route::post('cars/{car}/blocks', 'store')->name('store');
                Route::put('cars/{car}/blocks/{block}', 'update')->name('update');
                Route::delete('cars/{car}/blocks/{block}', 'destroy')->name('destroy');
            });
            Route::resource('pickup-locations', PickupLocationController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::put('pickup-locations/{pickupLocation}/main', MainPickupLocationController::class)->name('pickup-locations.main');
            Route::resource('seasons', PeakSeasonController::class)->only(['index', 'store', 'update', 'destroy']);
        });

        Route::middleware('permission:payments')->group(function () {
            Route::get('transfers', TransferController::class)->name('transfers');
            Route::get('bookings/{booking}/payment-proof', [BookingPaymentController::class, 'proof'])->name('bookings.payment.proof');
            Route::post('bookings/{booking}/payment/approve', [BookingPaymentController::class, 'approve'])->name('bookings.payment.approve');
            Route::post('bookings/{booking}/payment/reject', [BookingPaymentController::class, 'reject'])->name('bookings.payment.reject');
        });

        Route::middleware('permission:customers')->group(function () {
            Route::get('reviews', [ReviewController::class, 'index'])->name('reviews.index');
            Route::put('reviews/{review}/reply', [ReviewController::class, 'reply'])->name('reviews.reply');
            Route::get('renters', [RenterController::class, 'index'])->name('renters.index');
            Route::get('renters/export', [ExportController::class, 'renters'])->name('renters.export');
            Route::get('renters/{phoneKey}', [RenterController::class, 'show'])->name('renters.show')->where('phoneKey', '0\d{10}');
            Route::put('renters/{phoneKey}/flag', [RenterController::class, 'flag'])->name('renters.flag')->where('phoneKey', '0\d{10}');
        });

        // The owner only: money, settings, the booking page, staff and billing.
        Route::middleware('permission:owner')->group(function () {
            Route::get('revenue', [RevenueController::class, 'index'])->name('revenue.index');
            Route::get('revenue/export', [RevenueController::class, 'export'])->name('revenue.export');
            Route::get('storefront', [StorefrontController::class, 'edit'])->name('storefront.edit');
            Route::put('storefront', [StorefrontController::class, 'update'])->name('storefront.update');
            Route::get('policies', [PolicyController::class, 'edit'])->name('policies.edit');
            Route::put('policies', [PolicyController::class, 'update'])->name('policies.update');
            Route::get('payments', [PaymentSettingController::class, 'edit'])->name('payments.edit');
            Route::put('payments', [PaymentSettingController::class, 'update'])->name('payments.update');
            Route::get('billing', [BillingController::class, 'index'])->name('billing.index');
            Route::put('billing', [BillingController::class, 'update'])->name('billing.update');
            Route::post('billing/invoices/{invoice}/payment', [BillingController::class, 'pay'])->name('billing.invoices.pay');
            Route::get('team', [TeamController::class, 'index'])->name('team.index');
            Route::post('team', [TeamController::class, 'store'])->name('team.store');
            Route::put('team/{member}', [TeamController::class, 'update'])->name('team.update');
            Route::post('team/{member}/invitation', [TeamController::class, 'resend'])->middleware('throttle:6,1')->name('team.resend');
            Route::delete('team/{member}', [TeamController::class, 'destroy'])->name('team.destroy');

            Route::prefix('connections')->name('connections.')->controller(ConnectionController::class)->group(function () {
                Route::get('email', 'email')->name('email');
                Route::get('sms', 'sms')->name('sms');
                Route::get('calendar', 'calendar')->name('calendar');
                Route::put('calendar', 'updateCalendar')->name('calendar.update');
                Route::post('calendar/test', 'testCalendar')->middleware('throttle:6,1')->name('calendar.test');
                Route::put('reminders', 'updateReminders')->name('reminders.update');
                Route::get('deliveries', 'deliveries')->name('deliveries');
            });
        });
    });
