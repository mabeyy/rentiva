import type { Option } from '@/types/common';
import type { PickupLocation } from '@/types/storefront';

export type CarStatus =
    | 'draft'
    | 'pending_review'
    | 'active'
    | 'rejected'
    | 'suspended'
    | 'inactive';

export type CarImage = {
    id: number;
    url: string;
};

export type Feature = {
    id: number;
    name: string;
    cars_count?: number;
};

export type Car = {
    id: number;
    slug: string;
    name: string;
    make: string;
    model: string;
    year: number;
    body_type: Option;
    transmission: Option;
    fuel_type: Option;
    /** Null for scooters and motorcycles. */
    drivetrain: Option | null;
    seats: number;
    /** Null for scooters and motorcycles. */
    doors: number | null;
    luggage_capacity: number;
    fuel_economy_city: number | null;
    fuel_economy_highway: number | null;
    exterior_color: string;
    /** City of the car's pickup location. */
    location: string;
    pickup_location?: PickupLocation | null;
    description: string | null;
    /** Daily rate in centavos. */
    daily_rate: number;
    /** Refundable deposit in centavos, collected at pickup. */
    security_deposit: number;
    /** Percent off rentals of 7+ days. */
    weekly_discount: number;
    /** Percent off rentals of 28+ days. */
    monthly_discount: number;
    /** In centavos; null when the car isn't delivered. */
    delivery_fee: number | null;
    /** In centavos per day; null when no driver is offered. */
    driver_daily_rate: number | null;
    plate_number: string | null;
    registration_expires_on: string | null;
    insurance_expires_on: string | null;
    status: Option<CarStatus>;
    rejection_reason: string | null;
    host_name?: string;
    storefront_slug?: string | null;
    cover_image?: CarImage | null;
    images?: CarImage[];
    features?: Feature[];
    bookings_count?: number;
    created_at: string;
};

/**
 * Select options for a car's enum-backed specifications.
 */
export type CarSpecOptions = {
    bodyTypes: Option[];
    transmissions: Option[];
    fuelTypes: Option[];
    drivetrains: Option[];
};

export type BookedRange = {
    start_date: string;
    end_date: string;
};

/** Days an owner took a car off the calendar. Both dates are included. */
export type CarBlock = {
    id: number;
    start_date: string;
    end_date: string;
    reason: Option;
    note: string | null;
    car?: {
        id: number;
        slug: string;
        name: string;
        cover_image: string | null;
    };
};
