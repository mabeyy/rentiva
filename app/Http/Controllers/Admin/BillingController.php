<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Setting;
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
        $status = $request->validate(['status' => ['nullable', Rule::in(['unpaid', 'submitted', 'paid', 'rejected'])]])['status'] ?? null;

        return Inertia::render('admin/billing', [
            'invoices' => JsonResource::collection(Invoice::query()
                ->with('owner.storefront')
                ->when($status, fn ($query, string $status) => $query->where('status', $status))
                ->orderByRaw("case status when 'submitted' then 0 when 'unpaid' then 1 when 'rejected' then 2 else 3 end")
                ->latest('period_start')
                ->paginate(20)
                ->withQueryString()
                ->through(fn (Invoice $invoice): array => [
                    ...$invoice->only(['id', 'number', 'plan_name', 'amount', 'status', 'payment_reference', 'rejection_reason']),
                    'owner' => $invoice->owner->storefront?->name ?? $invoice->owner->name,
                    'period_start' => $invoice->period_start->toDateString(),
                    'period_end' => $invoice->period_end->toDateString(),
                    'due_on' => $invoice->due_on->toDateString(),
                    'is_overdue' => $invoice->isOverdue(),
                    'has_proof' => $invoice->proof_path !== null,
                ])),
            'status' => $status,
            'counts' => Invoice::query()->toBase()->selectRaw('status, count(*) as aggregate')->groupBy('status')->pluck('aggregate', 'status'),
            'bankAccounts' => Setting::get(Setting::PlatformBankAccounts) ?? [],
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

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Grace period saved.')]);

        return back();
    }

    /**
     * Mark a payment received, or send it back with a reason.
     */
    public function review(Request $request, Invoice $invoice): RedirectResponse
    {
        $data = $request->validate([
            'decision' => ['required', 'in:paid,rejected'],
            'reason' => ['required_if:decision,rejected', 'nullable', 'string', 'max:255'],
        ]);

        $invoice->forceFill($data['decision'] === 'paid'
            ? ['status' => 'paid', 'paid_at' => now(), 'rejection_reason' => null]
            : ['status' => 'rejected', 'rejection_reason' => $data['reason']])->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => $data['decision'] === 'paid' ? __(':number marked paid.', ['number' => $invoice->number]) : __('Payment sent back to the owner.')]);

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
     * Where owners send their payments: up to three accounts.
     */
    public function updateAccounts(Request $request): RedirectResponse
    {
        $accounts = $request->validate([
            'accounts' => ['array', 'max:3'],
            'accounts.*.bank_name' => ['required', 'string', 'max:80'],
            'accounts.*.account_name' => ['required', 'string', 'max:120'],
            'accounts.*.account_number' => ['required', 'string', 'max:40'],
        ])['accounts'] ?? [];

        Setting::put(Setting::PlatformBankAccounts, array_values($accounts));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment accounts saved.')]);

        return back();
    }
}
