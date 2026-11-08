import type { Option, PaymentMethod } from '@/types';

/** Used when an owner has no booking page settings yet. */
export const defaultPaymentMethods: Option[] = [
    { value: 'pickup', label: 'Pay at pickup' },
];

/**
 * How a booking total is described for a payment method, e.g. "Total, paid at pickup".
 */
export function totalLabelFor(
    method: PaymentMethod | null | undefined,
): string {
    if (method === 'pickup') {
        return 'Total, paid at pickup';
    }

    return method === 'bank_transfer'
        ? 'Total, paid by bank transfer'
        : 'Total';
}
