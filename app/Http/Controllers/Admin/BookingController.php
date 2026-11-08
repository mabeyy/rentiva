<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    /**
     * List all bookings, searchable by reference, renter or lessor.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::enum(BookingStatus::class)],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        return Inertia::render('admin/bookings/index', [
            'bookings' => BookingResource::collection(
                Booking::query()
                    ->when($filters['status'] ?? null, fn ($query, string $status) => $query->inStatus($status))
                    ->when($filters['search'] ?? null, fn ($query, string $search) => $query->where(
                        fn ($query) => $query->whereLike('reference', "%{$search}%")
                            ->orWhereLike('renter_name', "%{$search}%")
                            ->orWhereLike('renter_email', "%{$search}%")
                            ->orWhereHas('car.owner', fn ($query) => $query->whereLike('name', "%{$search}%")),
                    ))
                    ->with('car.owner.storefront')
                    ->latest()
                    ->paginate(20)
                    ->withQueryString(),
            ),
            'filters' => (object) $filters,
            'statuses' => BookingStatus::options(),
        ]);
    }
}
