import { Form, router } from '@inertiajs/react';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import BookingPaymentController from '@/actions/App/Http/Controllers/Lessor/BookingPaymentController';
import { FormField } from '@/components/form-field';
import { BrandButton } from '@/components/public/brand-button';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import type { Booking } from '@/types';

/**
 * The owner's verdict on a submitted transfer: mark it paid, or reject it with
 * a reason the renter sees so they can send it again.
 */
export function TransferDecision({
    booking,
    onDone,
}: {
    booking: Booking;
    onDone?: () => void;
}) {
    const [isRejecting, setIsRejecting] = useState(false);
    const [isApproving, setIsApproving] = useState(false);

    function approve(): void {
        router.post(
            BookingPaymentController.approve.url(booking.reference),
            {},
            {
                preserveScroll: true,
                onStart: () => setIsApproving(true),
                onFinish: () => setIsApproving(false),
                onSuccess: () => onDone?.(),
            },
        );
    }

    if (isRejecting) {
        return (
            <Form
                {...BookingPaymentController.reject.form(booking.reference)}
                options={{ preserveScroll: true }}
                onSuccess={() => onDone?.()}
                className="space-y-3"
            >
                {({ processing, errors }) => (
                    <>
                        <FormField
                            id={`reject-${booking.id}`}
                            label="Tell the renter what's wrong"
                            error={errors.reason}
                        >
                            <Textarea
                                id={`reject-${booking.id}`}
                                name="reason"
                                rows={3}
                                required
                                placeholder="The amount doesn't match, or I can't find this reference…"
                            />
                        </FormField>
                        <div className="flex flex-wrap justify-end gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsRejecting(false)}
                            >
                                Back
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                Ask renter to resend
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        );
    }

    return (
        <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsRejecting(true)}>
                <X /> Reject
            </Button>
            <BrandButton
                className="rounded-full px-5"
                disabled={isApproving}
                onClick={approve}
            >
                {isApproving ? <Spinner /> : <Check />}
                Mark as paid
            </BrandButton>
        </div>
    );
}
