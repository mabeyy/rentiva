import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarClock, CarFront, Inbox, Plus, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import { BookingStatusActions } from '@/components/bookings/booking-status-actions';
import { BookingsTable } from '@/components/bookings/bookings-table';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/lessor/page-header';
import { BrandButton } from '@/components/public/brand-button';
import { StatCard } from '@/components/stat-card';
import type { ChecklistStep } from '@/components/lessor/setup-checklist';
import { SetupChecklist } from '@/components/lessor/setup-checklist';
import { StorefrontLinkCard } from '@/components/storefront/storefront-link-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { formatPeso } from '@/lib/format';
import lessor from '@/routes/lessor';
import type { Booking, Storefront } from '@/types';

type Props = {
    stats: {
        activeCars: number;
        pendingRequests: number;
        upcomingTrips: number;
        /** Null for staff, who don't see earnings. */
        monthEarnings: number | null;
    };
    pendingBookings: Booking[];
    upcomingBookings: Booking[];
    storefront: Storefront | null;
    isSuspended: boolean;
    /** "Good morning" etc., worked out on the server in Philippine time. */
    greeting: string;
    /** Null once setup is done, or for staff. */
    checklist: ChecklistStep[] | null;
};

function DashboardSection({
    title,
    count,
    action,
    children,
}: {
    title: string;
    count: number;
    action?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
                    {title}
                    {count > 0 && (
                        <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-brand-foreground tabular-nums">
                            {count}
                        </span>
                    )}
                </h2>
                {action}
            </div>
            {children}
        </section>
    );
}

export default function LessorDashboard({
    stats,
    pendingBookings,
    upcomingBookings,
    storefront,
    isSuspended,
    greeting,
    checklist,
}: Props) {
    const { auth } = usePage().props;
    const firstName = auth.user.name.split(' ')[0];

    return (
        <>
            <Head title="Dashboard" />

            <div className="space-y-10 p-4 md:p-8">
                {isSuspended && (
                    <Alert variant="destructive">
                        <AlertTitle>Your account is suspended</AlertTitle>
                        <AlertDescription>
                            Your cars are hidden from renters and you cannot
                            edit listings. Contact support to resolve this.
                        </AlertDescription>
                    </Alert>
                )}

                <PageHeader
                    eyebrow="Dashboard"
                    title={
                        <>
                            {greeting},{' '}
                            <span className="text-brand">{firstName}</span>
                        </>
                    }
                    description={
                        stats.pendingRequests > 0
                            ? `You have ${stats.pendingRequests} booking ${stats.pendingRequests === 1 ? 'request' : 'requests'} waiting for your answer.`
                            : 'Your listings and bookings at a glance.'
                    }
                    actions={
                        !isSuspended && (
                            <BrandButton
                                size="lg"
                                className="rounded-full px-6"
                                asChild
                            >
                                <Link href={lessor.cars.create()}>
                                    <Plus /> List a car
                                </Link>
                            </BrandButton>
                        )
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Requests to review"
                        value={stats.pendingRequests}
                        icon={Inbox}
                        hint={
                            stats.pendingRequests > 0
                                ? 'Reply within 24 hours'
                                : "You're all caught up"
                        }
                        href={lessor.bookings.index({
                            query: { status: 'pending' },
                        })}
                        highlighted={stats.pendingRequests > 0}
                    />
                    <StatCard
                        label="Upcoming trips"
                        value={stats.upcomingTrips}
                        icon={CalendarClock}
                        hint="Confirmed and coming up"
                        href={lessor.bookings.index({
                            query: { status: 'confirmed' },
                        })}
                    />
                    <StatCard
                        label="Active listings"
                        value={stats.activeCars}
                        icon={CarFront}
                        hint="Live on your booking page"
                        href={lessor.cars.index()}
                    />
                    {stats.monthEarnings !== null && (
                        <StatCard
                            label="Earnings this month"
                            value={formatPeso(stats.monthEarnings)}
                            icon={Wallet}
                            hint={`${new Date().toLocaleString('en-PH', { month: 'long' })} so far`}
                        />
                    )}
                </div>

                {checklist && <SetupChecklist steps={checklist} />}

                {!isSuspended && <StorefrontLinkCard storefront={storefront} />}

                <DashboardSection
                    title="Requests waiting for you"
                    count={pendingBookings.length}
                    action={
                        <Button variant="ghost" size="sm" asChild>
                            <Link
                                href={lessor.bookings.index({
                                    query: { status: 'pending' },
                                })}
                            >
                                View all →
                            </Link>
                        </Button>
                    }
                >
                    {pendingBookings.length > 0 ? (
                        <BookingsTable
                            showPayment
                            bookings={pendingBookings}
                            actions={(booking) => (
                                <BookingStatusActions
                                    booking={booking}
                                    compact
                                />
                            )}
                        />
                    ) : (
                        <EmptyState
                            icon={Inbox}
                            title="You're all caught up"
                            description="New booking requests will show up here."
                        />
                    )}
                </DashboardSection>

                <DashboardSection
                    title="Upcoming trips"
                    count={upcomingBookings.length}
                >
                    {upcomingBookings.length > 0 ? (
                        <BookingsTable
                            showPayment
                            bookings={upcomingBookings}
                        />
                    ) : (
                        <EmptyState
                            icon={CalendarClock}
                            title="No upcoming trips"
                            description="Confirmed bookings appear here before pickup."
                        />
                    )}
                </DashboardSection>
            </div>
        </>
    );
}

LessorDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: lessor.dashboard() }],
};
