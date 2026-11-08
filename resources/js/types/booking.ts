import type { Car } from '@/types/car';
import type { Option } from '@/types/common';

export type BookingStatus =
    'pending' | 'confirmed' | 'declined' | 'cancelled' | 'completed';

export type PaymentMethod = 'pickup' | 'bank_transfer';

export type PaymentStatus = 'unpaid' | 'submitted' | 'paid' | 'rejected';

export type BookingInspection = {
    id: number;
    /** Eighths of a tank, 0–8. */
    fuel_level: number;
    odometer: number;
    notes: string | null;
    photo_count: number;
    recorded_by: string;
    created_at: string | null;
};

export type Booking = {
    id: number;
    reference: string;
    renter_name: string;
    /** Optional on bookings an owner adds. */
    renter_email: string | null;
    renter_phone: string;
    renter_license_number: string | null;
    start_date: string;
    end_date: string;
    days: number;
    /** Daily rate in centavos at booking time. */
    daily_rate: number;
    /** Days × daily rate, in centavos. */
    subtotal: number;
    discount: number;
    delivery_fee: number;
    driver_fee: number;
    /** What the renter pays, in centavos. */
    total: number;
    /** Refundable, collected at pickup and not part of the total. */
    security_deposit: number;
    charges_total: number;
    /** Due by transfer when the owner asks for a down payment; 0 otherwise. */
    down_payment: number;
    /** What the renter transfers: the down payment or the full total. */
    transfer_amount: number;
    /** Still to pay at pickup. */
    balance_due: number;
    deposit_collected_at: string | null;
    deposit_returned_amount: number | null;
    deposit_returned_at: string | null;
    deposit_note: string | null;
    /** Paid by transfer and confirmed by the owner. */
    amount_paid: number;
    /** Cancelled or declined after being paid, with no refund recorded yet. */
    needs_refund: boolean;
    refund_amount: number | null;
    refunded_at: string | null;
    refund_reference: string | null;
    refund_note: string | null;
    /** The renter's pending request to move their dates. */
    change_request: {
        start_date: string;
        end_date: string;
        note: string | null;
        requested_at: string;
    } | null;
    charges?: { id: number; label: string; amount: number }[];
    inspections?: Partial<Record<'pickup' | 'return', BookingInspection>>;
    with_driver: boolean;
    delivery_address: string | null;
    source: Option;
    has_license_photo: boolean;
    license_checked_at: string | null;
    status: Option<BookingStatus>;
    next_statuses: Option<BookingStatus>[];
    notes: string | null;
    decline_reason: string | null;
    payment_method: Option<PaymentMethod>;
    payment_status: Option<PaymentStatus>;
    /** When an unpaid bank transfer booking is released. */
    payment_due_at: string | null;
    payment_reference: string | null;
    payment_rejection_reason: string | null;
    payment_submitted_at: string | null;
    paid_at: string | null;
    has_payment_proof: boolean;
    car?: Car;
    created_at: string;
};
