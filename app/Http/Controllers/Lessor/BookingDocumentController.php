<?php

namespace App\Http\Controllers\Lessor;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Number;
use Illuminate\View\View;

class BookingDocumentController extends Controller
{
    /**
     * A printable receipt for the booking. Browsers save it as a PDF.
     */
    public function receipt(Booking $booking): View
    {
        return $this->document('documents.receipt', $booking);
    }

    /**
     * A printable rental agreement for both sides to sign at pickup.
     */
    public function agreement(Booking $booking): View
    {
        return $this->document('documents.agreement', $booking);
    }

    private function document(string $view, Booking $booking): View
    {
        Gate::authorize('update', $booking);

        $booking->load(['car.pickupLocation', 'car.owner.storefront.mainPickupLocation']);
        $owner = $booking->car->owner;
        $storefront = $owner->storefront;
        $mainLocation = $storefront?->mainPickupLocation;

        return view($view, [
            'booking' => $booking,
            'car' => $booking->car,
            'owner' => $owner,
            'storefront' => $storefront,
            'business' => $storefront?->name ?? $owner->name,
            'brand' => $storefront?->brand_color ?? '#e8590c',
            'address' => $mainLocation ? "{$mainLocation->address}, {$mainLocation->city}" : $storefront?->city,
            'peso' => fn (int $centavos): string => (string) Number::currency($centavos / 100, 'PHP', 'en_PH'),
        ]);
    }
}
