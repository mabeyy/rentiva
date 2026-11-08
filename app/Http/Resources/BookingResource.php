<?php

namespace App\Http\Resources;

use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Booking
 */
class BookingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'renter_name' => $this->renter_name,
            'renter_email' => $this->renter_email,
            'renter_phone' => $this->renter_phone,
            'renter_license_number' => $this->renter_license_number,
            'start_date' => $this->start_date->toDateString(),
            'end_date' => $this->end_date->toDateString(),
            'days' => $this->days(),
            'daily_rate' => $this->daily_rate,
            'subtotal' => $this->subtotal,
            'discount' => $this->discount,
            'delivery_fee' => $this->delivery_fee,
            'driver_fee' => $this->driver_fee,
            'charges_total' => $this->charges_total,
            'total' => $this->total,
            'down_payment' => $this->down_payment,
            'transfer_amount' => $this->transferAmount(),
            'balance_due' => $this->balanceDue(),
            'deposit_collected_at' => $this->deposit_collected_at,
            'deposit_returned_amount' => $this->deposit_returned_amount,
            'deposit_returned_at' => $this->deposit_returned_at,
            'deposit_note' => $this->deposit_note,
            'amount_paid' => $this->amountPaid(),
            'needs_refund' => $this->needsRefund(),
            'refund_amount' => $this->refund_amount,
            'refunded_at' => $this->refunded_at,
            'refund_reference' => $this->refund_reference,
            'refund_note' => $this->refund_note,
            'change_request' => $this->change_request,
            'charges' => $this->whenLoaded('charges', fn () => $this->charges->map(fn ($charge): array => [
                'id' => $charge->id,
                'label' => $charge->label,
                'amount' => $charge->amount,
            ])),
            'inspections' => $this->whenLoaded('inspections', fn () => $this->inspections->mapWithKeys(fn ($inspection): array => [
                $inspection->type => [
                    'id' => $inspection->id,
                    'fuel_level' => $inspection->fuel_level,
                    'odometer' => $inspection->odometer,
                    'notes' => $inspection->notes,
                    'photo_count' => count($inspection->photos ?? []),
                    'recorded_by' => $inspection->recorded_by,
                    'created_at' => $inspection->created_at?->toIso8601String(),
                ],
            ])),
            'security_deposit' => $this->security_deposit,
            'with_driver' => $this->with_driver,
            'delivery_address' => $this->delivery_address,
            'source' => $this->source->toOption(),
            'has_license_photo' => $this->license_photo_path !== null,
            'license_checked_at' => $this->license_checked_at,
            'status' => $this->status->toOption(),
            'next_statuses' => array_map(fn ($status) => $status->toOption(), $this->status->nextStatuses()),
            'notes' => $this->notes,
            'decline_reason' => $this->decline_reason,
            'payment_method' => $this->payment_method->toOption(),
            'payment_status' => $this->payment_status->toOption(),
            'payment_due_at' => $this->payment_due_at,
            'payment_reference' => $this->payment_reference,
            'payment_rejection_reason' => $this->payment_rejection_reason,
            'payment_submitted_at' => $this->payment_submitted_at,
            'paid_at' => $this->paid_at,
            'has_payment_proof' => $this->payment_proof_path !== null,
            'car' => CarResource::make($this->whenLoaded('car')),
            'created_at' => $this->created_at,
        ];
    }
}
