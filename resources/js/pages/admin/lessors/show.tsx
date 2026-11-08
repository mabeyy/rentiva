import { Head, Link, router } from '@inertiajs/react';
import {
    Ban,
    CheckCircle2,
    Eye,
    ExternalLink,
    Mail,
    Phone,
    Wallet,
    XCircle,
    Plug,
} from 'lucide-react';
import type {
    LessorInvoice,
    LessorSubscription,
} from '@/components/admin/lessor-plan-form';
import { LessorPlanForm } from '@/components/admin/lessor-plan-form';
import type { LessorRetention } from '@/components/admin/lessor-retention-form';
import { LessorRetentionForm } from '@/components/admin/lessor-retention-form';
import { LessorStatusButton } from '@/components/admin/lessor-status-button';
import { BookingsTable } from '@/components/bookings/bookings-table';
import { CarsTable } from '@/components/cars/cars-table';
import Heading from '@/components/heading';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { formatPeso } from '@/lib/format';
import admin from '@/routes/admin';
import type { Booking, Car, Lessor } from '@/types';

type Props = {
    lessor: Lessor;
    cars: Car[];
    recentBookings: Booking[];
    /** Null until the owner creates their booking page. */
    retention: LessorRetention | null;
    subscription: LessorSubscription;
    plans: { id: number; name: string; price: number }[];
    invoices: LessorInvoice[];
    stats: {
        earnings: number;
        completed: number;
        declined: number;
        cancelled: number;
    };
};

export default function AdminLessorsShow({
    lessor,
    cars,
    recentBookings,
    retention,
    subscription,
    plans,
    invoices,
    stats,
}: Props) {
    return (
        <>
            <Head title={lessor.name} />

            <div className="space-y-8 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                        <Heading
                            title={lessor.storefront?.name ?? lessor.name}
                            description={`Owner: ${lessor.name} · ${lessor.cars_count} cars · ${lessor.bookings_count} bookings`}
                        />
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <StatusBadge status={lessor.status} />
                            <span className="flex items-center gap-1">
                                <Mail className="size-4" /> {lessor.email}
                            </span>
                            <span className="flex items-center gap-1">
                                <Phone className="size-4" />{' '}
                                {lessor.phone ?? '—'}
                            </span>
                            {!lessor.email_verified_at && (
                                <span>Email not verified</span>
                            )}
                            {lessor.storefront && (
                                <a
                                    href={lessor.storefront.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 hover:text-foreground"
                                >
                                    <ExternalLink className="size-4" /> Booking
                                    page
                                </a>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {lessor.storefront && (
                            <Button variant="outline" asChild>
                                <Link
                                    href={admin.lessors.connections.email(
                                        lessor.id,
                                    )}
                                >
                                    <Plug /> Connections
                                </Link>
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={() =>
                                router.post(
                                    admin.lessors.impersonate(lessor.id).url,
                                )
                            }
                        >
                            <Eye /> View as owner
                        </Button>
                        <LessorStatusButton lessor={lessor} />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Confirmed booking value"
                        value={formatPeso(stats.earnings)}
                        icon={Wallet}
                    />
                    <StatCard
                        label="Completed trips"
                        value={stats.completed}
                        icon={CheckCircle2}
                    />
                    <StatCard
                        label="Declined requests"
                        value={stats.declined}
                        icon={XCircle}
                    />
                    <StatCard
                        label="Cancelled bookings"
                        value={stats.cancelled}
                        icon={Ban}
                    />
                </div>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">Cars</h2>
                    {cars.length > 0 ? (
                        <CarsTable
                            cars={cars}
                            actionLabel="Review"
                            actionHref={(car) => admin.cars.show(car.slug)}
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No cars listed.
                        </p>
                    )}
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">Recent bookings</h2>
                    {recentBookings.length > 0 ? (
                        <BookingsTable bookings={recentBookings} />
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No bookings yet.
                        </p>
                    )}
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">Plan and billing</h2>
                    <LessorPlanForm
                        lessorId={lessor.id}
                        subscription={subscription}
                        plans={plans}
                        invoices={invoices}
                    />
                </section>

                {retention && (
                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold">
                            Data retention
                        </h2>
                        <LessorRetentionForm
                            lessorId={lessor.id}
                            retention={retention}
                        />
                    </section>
                )}
            </div>
        </>
    );
}

AdminLessorsShow.layout = {
    breadcrumbs: [{ title: 'Lessors', href: admin.lessors.index() }],
};
