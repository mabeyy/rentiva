import {
    CalendarCheck,
    CarFront,
    Contact,
    CreditCard,
    History,
    Landmark,
    Layers,
    LayoutGrid,
    LifeBuoy,
    ListChecks,
    MapPin,
    Plug,
    Settings,
    ShieldCheck,
    Sparkles,
    Star,
    Store,
    Sun,
    TrendingUp,
    UserCog,
    Users,
    Wallet,
} from 'lucide-react';
import admin from '@/routes/admin';
import lessor from '@/routes/lessor';
import type { NavGroup, StaffPermission, UserRole } from '@/types';

/**
 * Sidebar sections for each signed-in role.
 */
export const navGroupsByRole: Record<UserRole, NavGroup[]> = {
    staff: [],
    admin: [
        {
            title: 'Overview',
            items: [
                {
                    title: 'Dashboard',
                    href: admin.dashboard(),
                    icon: LayoutGrid,
                },
                {
                    title: 'Activity',
                    href: admin.activity(),
                    icon: History,
                },
            ],
        },
        {
            title: 'Marketplace',
            items: [
                { title: 'Listings', href: admin.cars.index(), icon: CarFront },
                { title: 'Lessors', href: admin.lessors.index(), icon: Users },
                {
                    title: 'Bookings',
                    href: admin.bookings.index(),
                    icon: CalendarCheck,
                },
            ],
        },
        {
            title: 'Settings',
            items: [
                {
                    title: 'Features',
                    href: admin.features.index(),
                    icon: Sparkles,
                },
                {
                    title: 'Plans',
                    href: admin.plans.index(),
                    icon: Layers,
                },
                {
                    title: 'Billing',
                    href: admin.billing.index(),
                    icon: CreditCard,
                },
                {
                    title: 'Settings',
                    href: admin.settings.edit(),
                    icon: Settings,
                },
            ],
        },
    ],
    lessor: [
        {
            title: 'Overview',
            items: [
                {
                    title: 'Dashboard',
                    href: lessor.dashboard(),
                    icon: LayoutGrid,
                },
                {
                    title: 'Revenue',
                    permission: 'owner',
                    href: lessor.revenue.index(),
                    icon: TrendingUp,
                },
                {
                    title: 'Activity',
                    href: lessor.activity(),
                    icon: History,
                },
            ],
        },
        {
            title: 'Rentals',
            items: [
                {
                    title: 'Bookings',
                    permission: 'bookings',
                    href: lessor.bookings.calendar(),
                    section: lessor.bookings.index(),
                    icon: ListChecks,
                },
                {
                    title: 'Transfers',
                    permission: 'payments',
                    href: lessor.transfers(),
                    icon: Landmark,
                },
                {
                    title: 'Renters',
                    permission: 'customers',
                    href: lessor.renters.index(),
                    section: '/lessor/renters',
                    icon: Contact,
                },
                {
                    title: 'Reviews',
                    permission: 'customers',
                    href: lessor.reviews.index(),
                    icon: Star,
                },
            ],
        },
        {
            title: 'Fleet',
            items: [
                {
                    title: 'My cars',
                    permission: 'cars',
                    href: lessor.cars.index(),
                    icon: CarFront,
                },
                {
                    title: 'Pickup locations',
                    permission: 'cars',
                    href: lessor.pickupLocations.index(),
                    icon: MapPin,
                },
                {
                    title: 'Peak seasons',
                    permission: 'cars',
                    href: lessor.seasons.index(),
                    icon: Sun,
                },
            ],
        },
        {
            title: 'Storefront',
            items: [
                {
                    title: 'Booking page',
                    permission: 'owner',
                    href: lessor.storefront.edit(),
                    icon: Store,
                },
                {
                    title: 'Payments',
                    permission: 'owner',
                    href: lessor.payments.edit(),
                    icon: Wallet,
                },
                {
                    title: 'Policies',
                    permission: 'owner',
                    href: lessor.policies.edit(),
                    icon: ShieldCheck,
                },
                {
                    title: 'Connections',
                    permission: 'owner',
                    href: lessor.connections.email(),
                    section: '/lessor/connections',
                    icon: Plug,
                },
                {
                    title: 'Team',
                    href: lessor.team.index(),
                    icon: UserCog,
                    permission: 'owner',
                },
                {
                    title: 'Billing',
                    href: lessor.billing.index(),
                    icon: CreditCard,
                    permission: 'owner',
                },
                {
                    title: 'Help',
                    href: lessor.help(),
                    icon: LifeBuoy,
                },
            ],
        },
    ],
};

navGroupsByRole.staff = navGroupsByRole.lessor;

/**
 * Hide links a staff member wasn't given. Owners and admins see everything.
 */
export function visibleNavGroups(
    groups: NavGroup[],
    staffPermissions: StaffPermission[] | null,
): NavGroup[] {
    if (!staffPermissions) {
        return groups;
    }

    return groups
        .map((group) => ({
            ...group,
            items: group.items.filter(
                (item) =>
                    !item.permission ||
                    (item.permission !== 'owner' &&
                        staffPermissions.includes(item.permission)),
            ),
        }))
        .filter((group) => group.items.length > 0);
}
