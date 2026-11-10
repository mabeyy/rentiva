<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\Invoice;
use App\Models\Setting;
use App\Notifications\InvoiceCancelled;
use App\Notifications\InvoicePaymentReviewed;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BillingController extends Controller
{
    /**
     * Owners' invoices, payments to check first, and where owners pay.
     */
    public function index(Request $request): Response
    {
        $status = $request->validate(['status' => ['nullable', Rule::in(['unpaid', 'submitted', 'paid', 'rejected', 'cancelled'])]])['status'] ?? null;

        return Inertia::render('admin/billing', [
            'invoices' => JsonResource::collection(Invoice::query()
                ->with('owner.storefront')
                ->when($status, fn ($query, string $status) => $query->where('status', $status))
                ->orderByRaw("case status when 'submitted' then 0 when 'unpaid' then 1 when 'rejected' then 2 when 'paid' then 3 else 4 end")
                ->latest('period_start')
                ->paginate(20)
                ->withQueryString()
                ->through(fn (Invoice $invoice): array => [
                    ...$invoice->only(['id', 'number', 'plan_name', 'amount', 'status', 'payment_reference', 'rejection_reason', 'cancel_reason']),
                    'owner' => $invoice->owner
                        ? ($invoice->owner->storefront->name ?? $invoice->owner->name)
                        : __(':business (account deleted)', ['business' => $invoice->billed_to]),
                    'period_start' => $invoice->period_start->toDateString(),
                    'period_end' => $invoice->period_end->toDateString(),
                    'due_on' => $invoice->due_on->toDateString(),
                    'is_overdue' => $invoice->isOverdue(),
                    'has_proof' => $invoice->proof_path !== null,
                ])),
            'status' => $status,
            'counts' => Invoice::query()->toBase()->selectRaw('status, count(*) as aggregate')->groupBy('status')->pluck('aggregate', 'status'),
            'bankAccounts' => Setting::platformBankAccounts(),
            'graceDays' => (int) Setting::get(Setting::BillingGraceDays),
        ]);
    }

    /**
     * How long an invoice can be overdue before the owner's booking page
     * stops taking online bookings.
     */
    public function updateGrace(Request $request): RedirectResponse
    {
        $days = $request->validate(['grace_days' => ['required', 'integer', 'between:1,90']])['grace_days'];
        Setting::put(Setting::BillingGraceDays, (int) $days);
        AdminAction::record(null, 'grace_changed', __(':days days', ['days' => $days]));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Grace period saved.')]);

        return back();
    }

    /**
     * Mark a payment received, or send it back with a reason.
     */
    public function review(Request $request, Invoice $invoice): RedirectResponse
    {
        // Only a payment that's still owed or being checked can be decided, so a
        // stale tab can't mark a cancelled invoice paid or reject a paid one.
        abort_unless(match ($request->input('decision')) {
            'paid' => in_array($invoice->status, ['unpaid', 'submitted', 'rejected'], true),
            'rejected' => $invoice->status === 'submitted',
            default => true,
        }, 422);

        $data = $request->validate([
            'decision' => ['required', 'in:paid,rejected'],
            'reason' => ['required_if:decision,rejected', 'nullable', 'string', 'max:255'],
        ]);

        $invoice->forceFill($data['decision'] === 'paid'
            ? ['status' => 'paid', 'paid_at' => now(), 'rejection_reason' => null]
            : ['status' => 'rejected', 'rejection_reason' => $data['reason']])->save();

        $invoice->owner?->notify(new InvoicePaymentReviewed($invoice));
        AdminAction::record($invoice, $data['decision'] === 'paid' ? 'invoice_paid' : 'invoice_rejected', $data['reason'] ?? null);

        Inertia::flash('toast', ['type' => 'success', 'message' => $data['decision'] === 'paid' ? __(':number marked paid.', ['number' => $invoice->number]) : __('Payment sent back to the owner.')]);

        return back();
    }

    /**
     * Cancel an invoice issued by mistake, so the owner doesn't owe it (and
     * it can't pause their booking page). Paid invoices can't be cancelled.
     */
    public function cancel(Request $request, Invoice $invoice): RedirectResponse
    {
        abort_if(in_array($invoice->status, ['paid', 'cancelled'], true), 422);

        $reason = $request->validate(['reason' => ['required', 'string', 'max:255']])['reason'];
        $invoice->forceFill(['status' => 'cancelled', 'cancel_reason' => $reason])->save();
        $invoice->owner?->notify(new InvoiceCancelled($invoice));
        AdminAction::record($invoice, 'invoice_cancelled', $reason);

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':number cancelled.', ['number' => $invoice->number])]);

        return back();
    }

    /**
     * The owner's transfer screenshot.
     */
    public function proof(Invoice $invoice): StreamedResponse
    {
        abort_unless($invoice->proof_path && Storage::disk('local')->exists($invoice->proof_path), 404);

        return Storage::disk('local')->response($invoice->proof_path);
    }

    /**
     * Where owners send their payments: up to three accounts, each with an
     * optional QR code. Replaced or removed QR images are deleted.
     */
    public function updateAccounts(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'accounts' => ['array', 'max:3'],
            'accounts.*.bank_name' => ['required', 'string', 'max:80'],
            'accounts.*.account_name' => ['required', 'string', 'max:120'],
            'accounts.*.account_number' => ['required', 'string', 'max:40'],
            'accounts.*.qr_path' => ['nullable', 'string'],
            'accounts.*.qr' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $savedQrPaths = collect(Setting::platformBankAccounts())->pluck('qr_path')->filter();

        $accounts = collect($request->array('accounts'))
            ->map(function (array $account, int|string $index) use ($request, $savedQrPaths): array {
                // Only keep a QR this setting already saved, never a path sent from the browser.
                $qrPath = $savedQrPaths->contains($account['qr_path'] ?? null) ? $account['qr_path'] : null;

                if ($request->hasFile("accounts.{$index}.qr")) {
                    $qrPath = $request->file("accounts.{$index}.qr")->store('platform-qr', 'public') ?: null;
                }

                return [
                    'bank_name' => $account['bank_name'],
                    'account_name' => $account['account_name'],
                    'account_number' => $account['account_number'],
                    'qr_path' => $qrPath,
                ];
            })
            ->values();

        $savedQrPaths->diff($accounts->pluck('qr_path'))->each(fn (string $path) => Storage::disk('public')->delete($path));

        Setting::put(Setting::PlatformBankAccounts, $accounts->all());
        AdminAction::record(null, 'payment_accounts_changed', $accounts->pluck('bank_name')->implode(', ') ?: __('None'));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment accounts saved.')]);

        return back();
    }
}
