import type { BookingHost } from '@/components/bookings/booking-details';
import { BookingDetails } from '@/components/bookings/booking-details';
import type { TransferDetails } from '@/components/bookings/booking-payment-card';
import type { TripReview } from '@/components/bookings/trip-review';
import type { Booking } from '@/types';

/**
 * A booking whose owner has no booking page (rare: every lessor gets one at sign-up).
 */
export default function BookingShow(props: {
    booking: Booking;
    host: BookingHost | null;
    cancelUrl: string | null;
    cancellationNote?: string | null;
    payment: TransferDetails | null;
    review: TripReview | null;
    reviewUrl: string | null;
    changeRequestUrl: string | null;
}) {
    return <BookingDetails {...props} />;
}
