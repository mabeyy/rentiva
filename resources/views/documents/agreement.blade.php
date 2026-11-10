@extends('documents.layout')

@section('title', 'Rental agreement')

@section('content')
    <div class="grid">
        <div>
            <h2>Owner</h2>
            <strong>{{ $business }}</strong><br>
            <span class="muted">{{ $owner->name }}</span>
        </div>
        <div>
            <h2>Renter</h2>
            <strong>{{ $booking->renter_name }}</strong><br>
            <span class="muted">
                {{ $booking->renter_phone }}@if ($booking->renter_email) · {{ $booking->renter_email }}@endif<br>
                License no. {{ $booking->renter_license_number ?: '____________________' }}
            </span>
        </div>
    </div>

    <h2>Vehicle and period</h2>
    <table>
        <tr><th>Vehicle</th><td>{{ $car->name }} · {{ $car->exterior_color }}</td></tr>
        <tr><th>Plate number</th><td>{{ $car->plate_number ?: '____________________' }}</td></tr>
        <tr><th>Pickup</th><td>{{ $booking->start_date->format('l, M j, Y') }}, {{ $booking->pickupAt()->format('g:i A') }}@if ($booking->delivery_address) · delivered to {{ $booking->delivery_address }}@elseif ($car->pickupLocation) · {{ $car->pickupLocation->address }}, {{ $car->pickupLocation->city }}@endif</td></tr>
        <tr><th>Return</th><td>{{ $booking->end_date->format('l, M j, Y') }}, by {{ $booking->pickupAt()->format('g:i A') }}</td></tr>
        <tr><th>Fuel and mileage at pickup</th><td>Fuel ________ · Odometer ____________ km</td></tr>
    </table>

    <h2>Price</h2>
    <table>
        <tr><th>Total rental</th><td>{{ $peso($booking->total) }} ({{ $booking->payment_method->label() }})</td></tr>
        @if ($booking->with_driver)
            <tr><th>Driver</th><td>Included</td></tr>
        @endif
        <tr><th>Security deposit</th><td>{{ $booking->security_deposit > 0 ? $peso($booking->security_deposit).', returned when the vehicle comes back in the same condition' : 'None' }}</td></tr>
    </table>

    <h2>Terms</h2>
    <ol>
        <li>The renter holds a valid driver's license and is the only person who will drive the vehicle{{ $booking->with_driver ? ', unless the owner\'s driver is driving' : '' }}.</li>
        <li>The vehicle is returned on the date and time above, with the same fuel level, clean and in the same condition. Late returns may be charged at the daily rate.</li>
        <li>The renter pays for traffic violations, tolls, parking and fuel during the rental, and for damage or loss not covered by the vehicle's insurance.</li>
        @if ($storefront?->damage_participation_fee)
            <li>If the vehicle is damaged during the rental, the renter pays the first {{ $peso($storefront->damage_participation_fee) }} of the damage (participation fee).</li>
        @endif
        @if ($storefront?->damage_policy)
            <li>{{ $storefront->damage_policy }}</li>
        @endif
        <li>No smoking, no illegal use, and no leaving the agreed area without the owner's permission.</li>
        <li>The renter reports any accident, breakdown or damage to the owner right away.</li>
        @if ($storefront?->payment_policy)
            <li>{{ $storefront->payment_policy }}</li>
        @endif
    </ol>

    <div class="signatures">
        <div>{{ $business }}<br><span class="muted">Owner's signature and date</span></div>
        <div>{{ $booking->renter_name }}<br><span class="muted">Renter's signature and date</span></div>
    </div>
@endsection
