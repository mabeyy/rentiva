@php
    $isPaid = $invoice->status === 'paid';
    $title = $isPaid ? 'Receipt' : 'Invoice';
    $peso = fn (int $centavos): string => '₱'.number_format($centavos / 100, 2);
    $date = fn ($value): string => $value->timezone(\App\Models\Booking::PICKUP_TIMEZONE)->format('M j, Y');
    $statusLabel = match ($invoice->status) {
        'paid' => 'Paid',
        'submitted' => 'Payment being checked',
        'cancelled' => 'Cancelled',
        default => $invoice->isOverdue() ? 'Overdue' : 'Unpaid',
    };
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }} · {{ $invoice->number }}</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; background: #f4f4f5; color: #18181b; font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
        .page { max-width: 760px; margin: 32px auto; background: #fff; padding: 48px; border-radius: 16px; box-shadow: 0 1px 3px rgb(0 0 0 / .08); }
        .toolbar { max-width: 760px; margin: 24px auto 0; display: flex; justify-content: flex-end; gap: 8px; }
        .toolbar button, .toolbar a { font: inherit; padding: 8px 16px; border-radius: 999px; border: 1px solid #d4d4d8; background: #fff; color: inherit; cursor: pointer; text-decoration: none; }
        .toolbar button { background: #18181b; border-color: #18181b; color: #fff; }
        header { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 24px; border-bottom: 3px solid #e8590c; }
        h1 { margin: 0; font-size: 26px; letter-spacing: -.02em; }
        h2 { margin: 28px 0 8px; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: #71717a; }
        .muted { color: #71717a; }
        .right { text-align: right; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 8px 0; vertical-align: top; text-align: left; }
        th { font-weight: 500; color: #71717a; width: 38%; }
        .lines td { border-bottom: 1px dashed #e4e4e7; }
        .lines td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
        .total td { font-weight: 700; font-size: 18px; border-bottom: 0; padding-top: 14px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; background: #f4f4f5; font-size: 12px; font-weight: 600; }
        .badge.paid { background: #dcfce7; color: #166534; }
        .badge.cancelled { background: #fee2e2; color: #991b1b; }
        footer { margin-top: 40px; font-size: 12px; color: #a1a1aa; }
        @media print {
            body { background: #fff; }
            .toolbar { display: none; }
            .page { margin: 0; padding: 0; box-shadow: none; max-width: none; }
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <a href="{{ route('lessor.billing.index') }}">Back to billing</a>
        <button type="button" onclick="window.print()">Print or save as PDF</button>
    </div>
    <main class="page">
        <header>
            <div>
                <h1>{{ $seller }}</h1>
                <div class="muted">{{ $supportEmail }}</div>
            </div>
            <div class="right">
                <div style="font-size: 20px; font-weight: 700;">{{ $title }}</div>
                <div class="muted">{{ $invoice->number }}</div>
                <div class="muted">Issued {{ $date($invoice->created_at) }}</div>
            </div>
        </header>

        <div class="grid">
            <div>
                <h2>Billed to</h2>
                <strong>{{ $business }}</strong><br>
                <span class="muted">{{ $owner->name }} · {{ $owner->email }}</span>
            </div>
            <div>
                <h2>Status</h2>
                <span class="badge {{ $invoice->status }}">{{ $statusLabel }}</span>
                @if ($isPaid && $invoice->paid_at)
                    <span class="muted">on {{ $date($invoice->paid_at) }}</span>
                @elseif ($invoice->status !== 'cancelled')
                    <span class="muted">due {{ $invoice->due_on->format('M j, Y') }}</span>
                @endif
            </div>
        </div>

        <h2>Charges</h2>
        <table class="lines">
            <tr>
                <td>{{ $invoice->plan_name }} plan, {{ $invoice->period_start->format('M j') }} – {{ $invoice->period_end->format('M j, Y') }}</td>
                <td>{{ $peso($invoice->amount) }}</td>
            </tr>
            <tr class="total"><td>Total</td><td>{{ $peso($invoice->amount) }}</td></tr>
        </table>

        @if ($isPaid || $invoice->payment_reference || $invoice->cancel_reason)
            <h2>Payment</h2>
            <table>
                <tr><th>Method</th><td>Bank transfer</td></tr>
                @if ($invoice->payment_reference)
                    <tr><th>Reference</th><td>{{ $invoice->payment_reference }}</td></tr>
                @endif
                @if ($invoice->cancel_reason)
                    <tr><th>Cancelled because</th><td>{{ $invoice->cancel_reason }}</td></tr>
                @endif
            </table>
        @endif

        <footer>
            {{ $isPaid ? 'Thank you for your payment.' : 'Pay from the Billing page in your owner area.' }}
            Questions? Write to {{ $supportEmail }}.
        </footer>
    </main>
</body>
</html>
