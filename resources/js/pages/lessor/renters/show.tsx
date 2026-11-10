import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, Flag, IdCard, Mail, Phone } from 'lucide-react';
import { BookingsTable } from '@/components/bookings/bookings-table';
import { PageHeader } from '@/components/lessor/page-header';
import { RenterFlagDialog } from '@/components/lessor/renter-flag-dialog';
import { Button } from '@/components/ui/button';
import { formatPeso } from '@/lib/format';
import lessor from '@/routes/lessor';
import type { Booking } from '@/types';

type RenterProfile = {
    key: string;
    name: string;
    phone: string;
    email: string | null;
    other_phones: string[];
    other_emails: string[];
    license_number: string | null;
    total_spent: number;
    flag: string | null;
};

export default function LessorRenterShow({
    renter,
    bookings,
}: {
    renter: RenterProfile;
    bookings: Booking[];
}) {
    return (
        <>
            <Head title={renter.name} />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <PageHeader
                    title={renter.name}
                    description={`${bookings.length} ${bookings.length === 1 ? 'booking' : 'bookings'} with you · ${formatPeso(renter.total_spent)} spent`}
                    actions={
                        <RenterFlagDialog
                            renterKey={renter.key}
                            renterName={renter.name}
                            flag={renter.flag}
                            trigger={
                                <Button
                                    variant="outline"
                                    className="rounded-full"
                                >
                                    <Flag />{' '}
                                    {renter.flag ? 'Edit flag' : 'Flag renter'}
                                </Button>
                            }
                        />
                    }
                />

                {renter.flag && (
                    <div className="flex gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                        <p>{renter.flag}</p>
                    </div>
                )}

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <a
                        href={`tel:${renter.phone}`}
                        className="flex items-center gap-2 hover:underline"
                    >
                        <Phone className="size-4 text-muted-foreground" />
                        {renter.phone}
                    </a>
                    {renter.email && (
                        <a
                            href={`mailto:${renter.email}`}
                            className="flex items-center gap-2 hover:underline"
                        >
                            <Mail className="size-4 text-muted-foreground" />
                            {renter.email}
                        </a>
                    )}
                    {renter.other_phones.map((phone) => (
                        <span
                            key={phone}
                            className="flex items-center gap-2 text-muted-foreground"
                        >
                            <Phone className="size-4" />
                            {phone}
                        </span>
                    ))}
                    {renter.other_emails.map((email) => (
                        <span
                            key={email}
                            className="flex items-center gap-2 text-muted-foreground"
                        >
                            <Mail className="size-4" />
                            {email}
                        </span>
                    ))}
                    {renter.license_number && (
                        <span className="flex items-center gap-2">
                            <IdCard className="size-4 text-muted-foreground" />
                            {renter.license_number}
                        </span>
                    )}
                </div>

                <BookingsTable
                    bookings={bookings}
                    bookingHref={(booking) =>
                        lessor.bookings.show(booking.reference).url
                    }
                    actions={(booking) => (
                        <div className="flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full"
                                asChild
                            >
                                <Link
                                    href={lessor.bookings.show(
                                        booking.reference,
                                    )}
                                >
                                    View
                                </Link>
                            </Button>
                        </div>
                    )}
                />
            </div>
        </>
    );
}

LessorRenterShow.layout = {
    breadcrumbs: [{ title: 'Renters', href: lessor.renters.index() }],
};
