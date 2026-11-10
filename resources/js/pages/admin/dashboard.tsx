import { Head, Link } from '@inertiajs/react';
import {
    CalendarClock,
    CarFront,
    ClipboardCheck,
    Users,
    Wallet,
} from 'lucide-react';
import type { PlatformTraffic } from '@/components/analytics/growth-funnel';
import { GrowthFunnel } from '@/components/analytics/growth-funnel';
import { RevenueChart } from '@/components/admin/revenue-chart';
import type { AdminSetupStep } from '@/components/admin/setup-checklist';
import { AdminSetupChecklist } from '@/components/admin/setup-checklist';
import type { SubscriptionMetrics } from '@/components/admin/subscription-overview';
import { SubscriptionOverview } from '@/components/admin/subscription-overview';
import { UtilizationList } from '@/components/admin/utilization-list';
import { BookingsTable } from '@/components/bookings/bookings-table';
import { CarsTable } from '@/components/cars/cars-table';
import { EmptyState } from '@/components/empty-state';
import Heading from '@/components/heading';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatPeso } from '@/lib/format';
import admin from '@/routes/admin';
import type { BodyTypeUtilization, Booking, Car, DailyRevenue } from '@/types';

type Props = {
    stats: {
        lessors: number;
        listedCars: number;
        pendingReview: number;
        pendingBookings: number;
        monthRevenue: number;
    };
    subscriptions: SubscriptionMetrics;
    traffic: PlatformTraffic;
    /** Null once everything is set up. */
    setup: AdminSetupStep[] | null;
    revenue: DailyRevenue[];
    utilization: BodyTypeUtilization[];
    reviewQueue: Car[];
    recentBookings: Booking[];
};

export default function AdminDashboard({
    stats,
    subscriptions,
    traffic,
    setup,
    revenue,
    utilization,
    reviewQueue,
    recentBookings,
}: Props) {
    return (
        <>
            <Head title="Admin dashboard" />

            <div className="space-y-8 p-4 md:p-6">
                <Heading
                    title="Admin dashboard"
                    description="Platform health, moderation queue and activity."
                />

                {setup && <AdminSetupChecklist steps={setup} />}

                <SubscriptionOverview metrics={subscriptions} />

                <GrowthFunnel traffic={traffic} />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <StatCard
                        label="Booking value this month"
                        info="Total of all owners' confirmed and completed bookings starting this month. This is the owners' money, not Rentiva's revenue."
                        value={formatPeso(stats.monthRevenue)}
                        icon={Wallet}
                    />
                    <StatCard
                        label="Listed cars"
                        value={stats.listedCars}
                        icon={CarFront}
                    />
                    <StatCard
                        label="Awaiting review"
                        info="New listings owners submitted that need your approval before renters can see them."
                        value={stats.pendingReview}
                        icon={ClipboardCheck}
                    />
                    <StatCard
                        label="Pending bookings"
                        info="Requests renters sent that owners haven't answered yet."
                        value={stats.pendingBookings}
                        icon={CalendarClock}
                    />
                    <StatCard
                        label="Lessors"
                        value={stats.lessors}
                        icon={Users}
                    />
                </div>

                <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Booking value · last 14 days</CardTitle>
                            <CardDescription>
                                Confirmed and completed bookings by pickup date.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RevenueChart data={revenue} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Utilization · next 7 days</CardTitle>
                            <CardDescription>
                                Share of days already reserved, by car type.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UtilizationList items={utilization} />
                        </CardContent>
                    </Card>
                </div>

                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                            Approval queue
                        </h2>
                        <Button variant="outline" size="sm" asChild>
                            <Link
                                href={admin.cars.index({
                                    query: { status: 'pending_review' },
                                })}
                            >
                                View all
                            </Link>
                        </Button>
                    </div>
                    {reviewQueue.length > 0 ? (
                        <CarsTable
                            cars={reviewQueue}
                            showLessor
                            actionLabel="Review"
                            actionHref={(car) => admin.cars.show(car.slug)}
                        />
                    ) : (
                        <EmptyState
                            icon={ClipboardCheck}
                            title="Nothing to review"
                            description="New listings submitted by lessors appear here."
                        />
                    )}
                </section>

                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                            Latest bookings
                        </h2>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={admin.bookings.index()}>View all</Link>
                        </Button>
                    </div>
                    <BookingsTable bookings={recentBookings} />
                </section>
            </div>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: admin.dashboard() }],
};
