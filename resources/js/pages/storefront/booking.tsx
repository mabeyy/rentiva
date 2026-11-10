import type { BookingHost } from '@/components/bookings/booking-details';
import { BookingDetails } from '@/components/bookings/booking-details';
import type { TransferDetails } from '@/components/bookings/booking-payment-card';
import type { ChangeRequestCalendar } from '@/components/bookings/renter-change-request';
import type { TripReview } from '@/components/bookings/trip-review';
import storefronts from '@/routes/storefronts';
import type { Booking, Storefront } from '@/types';

/**
 * A booking made on an owner's page, shown inside that owner's branding.
 */
export default function StorefrontBooking({
    storefront,
    ...props
}: {
    storefront: Storefront;
    booking: Booking;
    host: BookingHost | null;
    cancelUrl: string | null;
    cancellationNote?: string | null;
    payment: TransferDetails | null;
    review: TripReview | null;
    reviewUrl: string | null;
    changeRequestUrl: string | null;
    changeRequestCalendar: ChangeRequestCalendar;
    withdrawChangeRequestUrl: string | null;
}) {
    return (
        <BookingDetails
            {...props}
            carHref={storefronts.cars.show({
                storefront: storefront.slug,
                car: props.booking.car!.slug,
            })}
        />
    );
}
