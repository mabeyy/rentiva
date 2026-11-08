import type { Option } from '@/types/common';

export type Storefront = {
    id: number;
    name: string;
    slug: string;
    url: string;
    listed_in_directory: boolean;
    /** Directory listing only: bookable cars, cheapest daily rate (centavos) and car types. */
    vehicle_count?: number;
    lowest_daily_rate?: number | null;
    body_types?: string[];
    tagline: string | null;
    about: string | null;
    /** The main pickup location's city. */
    city: string | null;
    main_pickup_location_id: number | null;
    phone: string | null;
    facebook_url: string | null;
    instagram_url: string | null;
    tiktok_url: string | null;
    logo_url: string | null;
    /** Owner's chosen hex color, or null for the default brand orange. */
    brand_color: string | null;
    /** Loaded on the owner's public pages. */
    pickup_locations?: PickupLocation[];
    /** Ways renters may pay this owner. */
    payment_methods: Option[];
    /** Renters must upload a license photo to book. */
    requires_license_photo: boolean;
    /** False on plans that remove "Powered by Rentiva". */
    show_platform_badge: boolean;
    /** Set in the directory when the owner's plan includes a featured listing. */
    is_featured?: boolean;
    /** False while the owner's booking page is paused for an unpaid invoice. */
    accepting_bookings: boolean;
    booking_rules: {
        min_days: number;
        notice_hours: number;
        max_advance_days: number;
        /** "HH:MM", Philippine time. */
        pickup_time: string;
    };
    peak_seasons: {
        start_date: string;
        end_date: string;
        rate_change: number;
    }[];
    /** The owner's payment & cancellation policy, agreed to when booking. */
    payment_policy: string | null;
};

/**
 * A place where an owner hands cars over.
 */
export type PickupLocation = {
    id: number;
    address: string;
    city: string;
    /** Only on the owner's pickup locations page. */
    cars_count?: number;
};

export type StorefrontSummary = {
    vehicleCount: number;
    /** Lowest daily rate in centavos, or null when the fleet is empty. */
    lowestDailyRate: number | null;
    bodyTypes: string[];
    reviewCount: number;
    /** Average stars (1 decimal), or null before the first review. */
    averageRating: number | null;
};
