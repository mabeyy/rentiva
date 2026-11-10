import { Link, router, usePage } from '@inertiajs/react';
import { CalendarDays, CalendarOff, List, Plus } from 'lucide-react';
import { useState } from 'react';
import type { ManualBookingOptions } from '@/components/bookings/manual-booking-form';
import { ManualBookingForm } from '@/components/bookings/manual-booking-form';
import { BrandButton } from '@/components/public/brand-button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';

const tabs = [
    {
        key: 'calendar',
        label: 'Calendar',
        icon: CalendarDays,
        href: lessor.bookings.calendar(),
    },
    { key: 'list', label: 'List', icon: List, href: lessor.bookings.index() },
    {
        key: 'blocked',
        label: 'Blocked',
        icon: CalendarOff,
        href: lessor.bookings.blocked(),
    },
] as const;

/**
 * Segmented tabs linking the calendar, list and blocked-dates views of the
 * bookings section, with a button that opens the add-booking form in a
 * modal. The form's data (cars, taken dates, seasons) loads the first time
 * the modal opens.
 */
export function BookingsViewTabs({
    active,
}: {
    active: (typeof tabs)[number]['key'];
}) {
    const { bookingForm } = usePage<{
        bookingForm?: ManualBookingOptions;
    }>().props;
    const [isAddOpen, setIsAddOpen] = useState(false);

    function openAdd(): void {
        setIsAddOpen(true);

        if (!bookingForm) {
            router.reload({ only: ['bookingForm'] });
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            <nav
                aria-label="Bookings view"
                className="flex h-11 items-center gap-1 rounded-full border bg-background p-1"
            >
                {tabs.map(({ key, label, icon: Icon, href }) => (
                    <Link
                        key={key}
                        href={href}
                        aria-current={active === key ? 'page' : undefined}
                        className={cn(
                            'flex h-full items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-4',
                            active === key
                                ? 'bg-ink text-ink-foreground'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <Icon /> {label}
                    </Link>
                ))}
            </nav>
            <BrandButton className="h-11 rounded-full px-5" onClick={openAdd}>
                <Plus /> Add booking
            </BrandButton>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add a booking</DialogTitle>
                        <DialogDescription>
                            For bookings you took by phone, chat or in person.
                            It's confirmed straight away.
                        </DialogDescription>
                    </DialogHeader>
                    {bookingForm ? (
                        <ManualBookingForm
                            options={bookingForm}
                            onCancel={() => setIsAddOpen(false)}
                            onSuccess={() => setIsAddOpen(false)}
                        />
                    ) : (
                        <div className="space-y-4" aria-busy="true">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
