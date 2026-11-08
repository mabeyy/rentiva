import { Head, Link } from '@inertiajs/react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { CarModerationActions } from '@/components/admin/car-moderation-actions';
import { BookingsTable } from '@/components/bookings/bookings-table';
import { blockPeriod } from '@/components/bookings/block-dates-dialog';
import { CarFeatureList } from '@/components/cars/car-feature-list';
import { CarGallery } from '@/components/cars/car-gallery';
import { CarSpecList } from '@/components/cars/car-spec-list';
import Heading from '@/components/heading';
import { StatusBadge } from '@/components/status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPeso } from '@/lib/format';
import admin from '@/routes/admin';
import type {
    Booking,
    Car,
    CarBlock,
    CarStatus,
    Lessor,
    Option,
} from '@/types';

type Props = {
    car: Car;
    owner: Lessor;
    bookings: Booking[];
    /** Upcoming days the owner took the car off the calendar. */
    blocks: CarBlock[];
    moderationStatuses: Option<CarStatus>[];
};

export default function AdminCarsShow({
    car,
    owner,
    bookings,
    blocks,
    moderationStatuses,
}: Props) {
    return (
        <>
            <Head title={`Review ${car.name}`} />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                        <Heading
                            title={car.name}
                            description={`${car.body_type.label} · ${formatPeso(car.daily_rate)} / day`}
                        />
                        <StatusBadge status={car.status} />
                    </div>
                    <CarModerationActions
                        car={car}
                        statuses={moderationStatuses}
                    />
                </div>

                {car.rejection_reason && (
                    <Alert variant="destructive">
                        <AlertTitle>Reason given to the lessor</AlertTitle>
                        <AlertDescription>
                            {car.rejection_reason}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
                    <div className="min-w-0 space-y-6">
                        <CarGallery images={car.images ?? []} alt={car.name} />
                        <Card>
                            <CardHeader>
                                <CardTitle>Specifications</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <CarSpecList car={car} />
                                {car.features && car.features.length > 0 && (
                                    <CarFeatureList features={car.features} />
                                )}
                                {car.description && (
                                    <p className="text-sm whitespace-pre-line text-muted-foreground">
                                        {car.description}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="xl:self-start">
                        <CardHeader>
                            <CardTitle>Owner</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <div className="font-medium">
                                        {owner.storefront?.name ?? owner.name}
                                    </div>
                                    {owner.storefront && (
                                        <div className="text-xs text-muted-foreground">
                                            {owner.name}
                                        </div>
                                    )}
                                </div>
                                <StatusBadge status={owner.status} />
                            </div>
                            <p className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="size-4" /> {owner.email}
                            </p>
                            <p className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="size-4" />{' '}
                                {owner.phone ?? '—'}
                            </p>
                            <p className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="size-4" /> {car.location}
                            </p>
                            <p className="text-muted-foreground">
                                {owner.cars_count} cars · {owner.bookings_count}{' '}
                                bookings
                            </p>
                            <Button
                                variant="outline"
                                className="w-full"
                                asChild
                            >
                                <Link href={admin.lessors.show(owner.id)}>
                                    View lessor profile
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">Recent bookings</h2>
                    {bookings.length > 0 ? (
                        <BookingsTable bookings={bookings} />
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No bookings yet.
                        </p>
                    )}
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">Blocked dates</h2>
                    {blocks.length > 0 ? (
                        <ul className="divide-y rounded-xl border text-sm">
                            {blocks.map((block) => (
                                <li
                                    key={block.id}
                                    className="flex flex-wrap justify-between gap-2 px-4 py-2.5"
                                >
                                    <span className="font-medium tabular-nums">
                                        {blockPeriod(block)}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {block.reason.label}
                                        {block.note && ` · ${block.note}`}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No upcoming blocked dates.
                        </p>
                    )}
                </section>
            </div>
        </>
    );
}

AdminCarsShow.layout = {
    breadcrumbs: [{ title: 'Listings', href: admin.cars.index() }],
};
