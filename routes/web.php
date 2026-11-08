<?php

use App\Http\Controllers\Admin\ImpersonationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Public\BookingChangeRequestController;
use App\Http\Controllers\Public\BookingController;
use App\Http\Controllers\Public\BookingLookupController;
use App\Http\Controllers\Public\BookingPaymentController;
use App\Http\Controllers\Public\DirectoryController;
use App\Http\Controllers\Public\HomeController;
use App\Http\Controllers\Public\PrivacyController;
use App\Http\Controllers\Public\ReviewController;
use App\Http\Controllers\Public\StorefrontController;
use App\Http\Controllers\Public\TermsController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

Route::get('rent', DirectoryController::class)->name('rent');
Route::get('privacy', [PrivacyController::class, 'platform'])->name('privacy');
Route::get('terms', TermsController::class)->name('terms');

Route::post('cars/{car}/bookings', [BookingController::class, 'store'])
    ->middleware('throttle:10,1')
    ->name('cars.bookings.store');

Route::get('bookings/find', [BookingLookupController::class, 'create'])->name('bookings.lookup');
Route::post('bookings/find', [BookingLookupController::class, 'store'])
    ->middleware('throttle:10,1')
    ->name('bookings.lookup.store');

Route::middleware('signed')->group(function () {
    Route::post('bookings/{booking}/change-request', [BookingChangeRequestController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('bookings.change-request.store');
    Route::get('bookings/{booking}', [BookingController::class, 'show'])->name('bookings.show');
    Route::delete('bookings/{booking}', [BookingController::class, 'destroy'])->name('bookings.destroy');
    Route::post('bookings/{booking}/payment', [BookingPaymentController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('bookings.payment.store');
    Route::post('bookings/{booking}/review', [ReviewController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('bookings.review.store');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
});

require __DIR__.'/lessor.php';
require __DIR__.'/admin.php';
require __DIR__.'/settings.php';

/*
 * Lessor storefronts live at the root, e.g. /abqcarrental. They are registered
 * last so every app page above wins; Storefront::isReservedSlug() keeps lessors
 * from claiming those paths.
 */
Route::get('{storefront}', [StorefrontController::class, 'show'])
    ->where('storefront', '[a-z0-9-]+')
    ->name('storefronts.show');
Route::get('{storefront}/find-booking', [BookingLookupController::class, 'create'])
    ->where('storefront', '[a-z0-9-]+')
    ->name('storefronts.bookings.lookup');
Route::get('{storefront}/privacy', [PrivacyController::class, 'storefront'])
    ->where('storefront', '[a-z0-9-]+')
    ->name('storefronts.privacy');
Route::get('{storefront}/{car}', [StorefrontController::class, 'car'])
    ->where('storefront', '[a-z0-9-]+')
    ->name('storefronts.cars.show');

Route::post('impersonation/stop', [ImpersonationController::class, 'destroy'])->middleware('auth')->name('impersonation.stop');
