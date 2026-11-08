import { Link, usePage } from '@inertiajs/react';
import { privacy, register, rent, terms } from '@/routes';
import bookings from '@/routes/bookings';

export function SiteFooter() {
    const { name } = usePage().props;

    return (
        <footer className="border-t bg-muted/40">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p>
                    © {new Date().getFullYear()} {name}. Booking pages for car
                    rental businesses.
                </p>
                <nav className="flex flex-wrap gap-x-6 gap-y-2">
                    <Link href={register()} className="hover:text-foreground">
                        Get your booking page
                    </Link>
                    <Link href={rent()} className="hover:text-foreground">
                        Rent a car
                    </Link>
                    <Link
                        href={bookings.lookup()}
                        className="hover:text-foreground"
                    >
                        Find my booking
                    </Link>
                    <Link href={privacy()} className="hover:text-foreground">
                        Privacy
                    </Link>
                    <Link href={terms()} className="hover:text-foreground">
                        Terms
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
