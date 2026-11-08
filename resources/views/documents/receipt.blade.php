@extends('documents.layout')

@section('title', 'Receipt')

@section('content')
    <div class="grid">
        <div>
            <h2>Billed to</h2>
            <strong>{{ $booking->renter_name }}</strong><br>
            <span class="muted">{{ $booking->renter_phone }}@if ($booking->renter_email) · {{ $booking->renter_email }}@endif</span>
        </div>
        <div>
            <h2>Rental</h2>
            <strong>{{ $car->name }}</strong><br>
            <span class="muted">{{ $booking->period() }} · {{ $booking->days() }} {{ str('day')->plural($booking->days()) }}</span>
        </div>
    </div>

    <h2>Charges</h2>
    <table class="lines">
        <tr><td>{{ $peso($booking->daily_rate) }} × {{ $booking->days() }} {{ str('day')->plural($booking->days()) }}</td><td>{{ $peso($booking->subtotal) }}</td></tr>
        @if ($booking->discount > 0)
            <tr><td>Long-stay discount</td><td>−{{ $peso($booking->discount) }}</td></tr>
        @endif
        @if ($booking->driver_fee > 0)
            <tr><td>Driver</td><td>{{ $peso($booking->driver_fee) }}</td></tr>
        @endif
        @if ($booking->delivery_fee > 0)
            <tr><td>Delivery{{ $booking->delivery_address ? ' to '.$booking->delivery_address : '' }}</td><td>{{ $peso($booking->delivery_fee) }}</td></tr>
        @endif
        <tr class="total"><td>Total</td><td>{{ $peso($booking->total) }}</td></tr>
    </table>

    <h2>Payment</h2>
    <table>
        <tr><th>Method</th><td>{{ $booking->payment_method->label() }}</td></tr>
        <tr>
            <th>Status</th>
            <td>
                <span class="badge">{{ $booking->payment_status === \App\Enums\PaymentStatus::Paid ? 'Paid' : 'Not paid yet' }}</span>
                @if ($booking->paid_at) <span class="muted">on {{ $booking->paid_at->timezone(\App\Models\Booking::PICKUP_TIMEZONE)->format('M j, Y') }}</span>@endif
            </td>
        </tr>
        @if ($booking->payment_reference)
            <tr><th>Reference</th><td>{{ $booking->payment_reference }}</td></tr>
        @endif
        @if ($booking->security_deposit > 0)
            <tr><th>Security deposit</th><td>{{ $peso($booking->security_deposit) }}, refundable, collected at pickup and not included in the total</td></tr>
        @endif
    </table>
@endsection
