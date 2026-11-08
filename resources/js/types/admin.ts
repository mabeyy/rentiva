import type { UserStatus } from '@/types/auth';
import type { Option } from '@/types/common';
import type { Storefront } from '@/types/storefront';

export type Lessor = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    status: Option<UserStatus>;
    email_verified_at: string | null;
    storefront?: Storefront | null;
    cars_count?: number;
    bookings_count?: number;
    created_at: string;
};

export type DailyRevenue = {
    date: string;
    total: number;
};

export type BodyTypeUtilization = {
    body_type: string;
    utilization: number;
};
