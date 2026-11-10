import { Head, Link, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowRight,
    CalendarClock,
    CarFront,
    Inbox,
    Plus,
    Wallet,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { BookingPageTraffic } from '@/components/analytics/booking-page-traffic';
import { BookingPageTrafficCard } from '@/components/analytics/booking-page-traffic';
import type { AgendaEvent } from '@/components/lessor/dashboard-lists';
import {
    AgendaList,
    DashboardPanel,
    RequestList,
    ToCloseList,
} from '@/components/lessor/dashboard-lists';
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
import type { RouteDefinition } from '@/wayfinder';

type Props = {
    stats: {
        activeCars: number;
        pendingRequests: number;
        upcomingTrips: number;
        /** Null for staff, who don't see earnings. */
        monthEarnings: number | null;
    };
    pendingBookings: Booking[];
    /** Pickups and returns over the next 7 days. */
    agenda: AgendaEvent[];
    /** Confirmed trips whose return date has passed. */
    toClose: Booking[];
    storefront: Storefront | null;
    isSuspended: boolean;
    /** "Good morning" etc., worked out on the server in Philippine time. */
    greeting: string;
    /** Null once setup is done, or for staff. */
    checklist: ChecklistStep[] | null;
    /** Null until the owner has a booking page. */
    traffic: BookingPageTraffic | null;
};

function ViewAll({
    href,
    label = 'View all',
}: {
    href: RouteDefinition<'get'>;
    label?: string;
}) {
    return (
        <Button variant="ghost" size="sm" className="rounded-full" asChild>
            <Link href={href}>
                {label} <ArrowRight />
            </Link>
        </Button>
    );
}

/** A one-line empty state that doesn't take over the column. */
function QuietNote({
    icon: Icon,
    children,
}: {
    icon: LucideIcon;
    children: ReactNode;
}) {
    return (
        <p className="flex items-center gap-3 rounded-2xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
            <Icon className="size-4 shrink-0" />
            {children}
        </p>
    );
}

export default function LessorDashboard({
    stats,
    pendingBookings,
    agenda,
    toClose,
    storefront,
    isSuspended,
    greeting,
    checklist,
    traffic,
}: Props) {
    const { auth } = usePage().props;
    const firstName = auth.user.name.split(' ')[0];

    return (
        <>
            <Head title="Dashboard" />

            <div className="mx-auto w-full max-w-7xl space-y-10 p-4 md:p-8">
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

                <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                    <StatCard
                        dense
                        label="Requests to review"
                        info="Booking requests renters sent that you haven't confirmed or declined yet. A request you don't answer within 48 hours, or before its pickup time, expires and the dates open up again."
                        value={stats.pendingRequests}
                        icon={Inbox}
                        hint={
                            stats.pendingRequests > 0
                                ? 'They expire after 48 hours'
                                : "You're all caught up"
                        }
                        href={lessor.bookings.index({
                            query: { status: 'pending' },
                        })}
                        highlighted={stats.pendingRequests > 0}
                    />
                    <StatCard
                        dense
                        label="Upcoming trips"
                        info="Confirmed bookings with a pickup today or later."
                        value={stats.upcomingTrips}
                        icon={CalendarClock}
                        hint="Confirmed and coming up"
                        href={lessor.bookings.index({
                            query: { status: 'confirmed' },
                        })}
                    />
                    <StatCard
                        dense
                        label="Active listings"
                        info="Cars live on your booking page. Drafts and cars waiting for review aren't counted."
                        value={stats.activeCars}
                        icon={CarFront}
                        hint="Live on your booking page"
                        href={lessor.cars.index()}
                    />
                    {stats.monthEarnings !== null && (
                        <StatCard
                            dense
                            label="Earnings this month"
                            info="Total of confirmed and completed bookings that start this month. Cancelled and declined bookings aren't counted."
                            value={formatPeso(stats.monthEarnings)}
                            icon={Wallet}
                            hint={`${new Date().toLocaleString('en-PH', { month: 'long' })} so far`}
                        />
                    )}
                </div>

                {checklist && <SetupChecklist steps={checklist} />}

                <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
                    <div className="space-y-8">
                        <DashboardPanel
                            title="Requests waiting for you"
                            count={stats.pendingRequests}
                            action={
                                stats.pendingRequests >
                                    pendingBookings.length && (
                                    <ViewAll
                                        href={lessor.bookings.index({
                                            query: { status: 'pending' },
                                        })}
                                    />
                                )
                            }
                        >
                            {pendingBookings.length > 0 ? (
                                <RequestList bookings={pendingBookings} />
                            ) : (
                                <QuietNote icon={Inbox}>
                                    You're all caught up. New requests show up
                                    here.
                                </QuietNote>
                            )}
                        </DashboardPanel>

                        {toClose.length > 0 && (
                            <DashboardPanel
                                title="Trips to close"
                                count={toClose.length}
                            >
                                <p className="-mt-1 text-sm text-muted-foreground">
                                    These cars are back. Mark each trip
                                    completed once you've checked the car, so it
                                    counts in your revenue and the renter can
                                    leave a review.
                                </p>
                                <ToCloseList bookings={toClose} />
                            </DashboardPanel>
                        )}

                        <DashboardPanel
                            title="This week"
                            action={
                                <ViewAll
                                    href={lessor.bookings.calendar()}
                                    label="Calendar"
                                />
                            }
                        >
                            {agenda.length > 0 ? (
                                <AgendaList events={agenda} />
                            ) : (
                                <QuietNote icon={CalendarClock}>
                                    No pickups or returns in the next 7 days.
                                </QuietNote>
                            )}
                        </DashboardPanel>
                    </div>

                    <aside className="space-y-6 lg:sticky lg:top-6">
                        {!isSuspended && (
                            <StorefrontLinkCard
                                storefront={storefront}
                                stacked
                            />
                        )}
                        {traffic && (
                            <BookingPageTrafficCard traffic={traffic} />
                        )}
                    </aside>
                </div>
            </div>
        </>
    );
}

LessorDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: lessor.dashboard() }],
};
