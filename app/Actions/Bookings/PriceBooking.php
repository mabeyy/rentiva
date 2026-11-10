<?php

namespace App\Actions\Bookings;

use App\Models\Car;
use App\Models\PeakSeason;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

/**
 * Works out what a rental costs: each day at the daily rate (raised or
 * lowered in the owner's peak and low seasons), less any long-stay discount,
 * plus delivery and a driver if chosen. The security deposit is
 * collected separately and returned, so it's not part of the total.
 */
class PriceBooking
{
    /** Rentals this long or longer get the weekly discount. */
    public const int WEEKLY_DAYS = 7;

    /** Rentals this long or longer get the monthly discount instead. */
    public const int MONTHLY_DAYS = 28;

    /**
     * @return array{daily_rate: int, subtotal: int, discount: int, delivery_fee: int, driver_fee: int, total: int, security_deposit: int}
     */
    public function handle(Car $car, CarbonInterface $startDate, CarbonInterface $endDate, bool $withDelivery = false, bool $withDriver = false): array
    {
        $days = (int) $startDate->diffInDays($endDate);
        $seasons = $car->owner->planIncludes('peak_pricing')
            ? $car->owner->peakSeasons()->whereDate('start_date', '<', $endDate)->whereDate('end_date', '>=', $startDate)->get()
            : collect();
        $subtotal = 0;

        for ($day = CarbonImmutable::parse($startDate)->startOfDay(); $day->lt(CarbonImmutable::parse($endDate)->startOfDay()); $day = $day->addDay()) {
            $rateChange = $seasons->first(fn (PeakSeason $season): bool => $season->covers($day))->rate_change ?? 0;
            $subtotal += (int) round($car->daily_rate * (100 + $rateChange) / 100);
        }

        $discountPercent = match (true) {
            $days >= self::MONTHLY_DAYS && $car->monthly_discount > 0 => $car->monthly_discount,
            $days >= self::WEEKLY_DAYS => $car->weekly_discount,
            default => 0,
        };
        $discount = intdiv($subtotal * $discountPercent, 100);
        $deliveryFee = $withDelivery && $car->delivery_fee !== null ? $car->delivery_fee : 0;
        $driverFee = $withDriver && $car->driver_daily_rate !== null ? $car->driver_daily_rate * $days : 0;

        return [
            'daily_rate' => $car->daily_rate,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'delivery_fee' => $deliveryFee,
            'driver_fee' => $driverFee,
            'total' => $subtotal - $discount + $deliveryFee + $driverFee,
            'security_deposit' => self::deposit($subtotal - $discount, $car->deposit_percent),
        ];
    }

    /**
     * The security deposit: a percent of the rental (before delivery and
     * driver fees), rounded to the nearest peso.
     */
    public static function deposit(int $rental, int $percent): int
    {
        return (int) round($rental * $percent / 100 / 100) * 100;
    }
}
