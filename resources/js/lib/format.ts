import { format, parseISO } from 'date-fns';

const pesoFormatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
});

/**
 * Format an amount stored in centavos as Philippine pesos, e.g. "₱3,500".
 */
export function formatPeso(centavos: number): string {
    return pesoFormatter.format(centavos / 100);
}

/**
 * Format an ISO date (YYYY-MM-DD) for display, e.g. "Nov 6, 2026".
 */
export function formatDate(date: string): string {
    return format(parseISO(date), 'MMM d, yyyy');
}

/**
 * Format a rental period, e.g. "Nov 6 – Nov 9, 2026".
 */
export function formatDateRange(startDate: string, endDate: string): string {
    return `${format(parseISO(startDate), 'MMM d')} – ${formatDate(endDate)}`;
}

/**
 * Convert a Date to an ISO date string in local time (no UTC shift).
 */
export function toIsoDate(date: Date): string {
    return format(date, 'yyyy-MM-dd');
}

/**
 * Format a fuel economy pair in km/L, e.g. "12.5 / 16.0 km/L".
 */
export function formatFuelEconomy(
    city: number | null,
    highway: number | null,
): string | null {
    if (city === null && highway === null) {
        return null;
    }

    return `${city ?? '–'} / ${highway ?? '–'} km/L`;
}

const manilaDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
});

/**
 * Format a timestamp in Philippine time, e.g. "Mon, Nov 9 · 3:30 PM", so the
 * server render and every visitor's browser show the same moment.
 */
export function formatManilaDateTime(timestamp: string): string {
    const parts = Object.fromEntries(
        manilaDateTimeFormatter
            .formatToParts(new Date(timestamp))
            .map((part) => [part.type, part.value]),
    );

    return `${parts.weekday}, ${parts.month} ${parts.day} · ${parts.hour}:${parts.minute} ${parts.dayPeriod}`;
}
