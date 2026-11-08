import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    /** Highlight the link anywhere under this URL (defaults to `href`). */
    section?: NonNullable<InertiaLinkProps['href']>;
    /** What a staff member needs to see it; "owner" hides it from staff. */
    permission?: StaffPermission | 'owner';
};

export type StaffPermission = 'bookings' | 'cars' | 'payments' | 'customers';

/** A labelled section of sidebar links. */
export type NavGroup = {
    title: string;
    items: NavItem[];
};
