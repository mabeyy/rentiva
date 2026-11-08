import { Link } from '@inertiajs/react';
import { CalendarDays, CalendarOff, List, Plus } from 'lucide-react';
import { BrandButton } from '@/components/public/brand-button';
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
 * bookings section, with a button to add a booking taken by phone or in
 * person.
 */
export function BookingsViewTabs({
    active,
}: {
    active: (typeof tabs)[number]['key'];
}) {
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
            <BrandButton className="h-11 rounded-full px-5" asChild>
                <Link href={lessor.bookings.create()}>
                    <Plus /> Add booking
                </Link>
            </BrandButton>
        </div>
    );
}
