<?php

namespace App\Concerns;

use App\Enums\BlockReason;
use App\Http\Resources\CarBlockResource;
use App\Models\Booking;
use App\Models\Car;
use App\Models\CarBlock;
use App\Models\User;

trait ProvidesBlockOptions
{
    /**
     * What the "Block dates" dialog needs: the owner's cars, the reasons, and
     * the days each car is already booked or blocked.
     *
     * @return array{cars: array<int, array{slug: string, name: string}>, reasons: array<int, array{value: string, label: string}>, bookedRanges: array<string, array<int, array{start_date: string, end_date: string}>>, blocks: mixed}
     */
    protected function blockOptions(User $owner): array
    {
        $cars = $owner->cars()->oldest('make')->oldest('model')->get();

        return [
            'cars' => $cars->map(fn (Car $car): array => ['slug' => $car->slug, 'name' => $car->name])->all(),
            'reasons' => BlockReason::options(),
            'bookedRanges' => Booking::query()
                ->whereIn('car_id', $cars->modelKeys())
                ->reserving()
                ->whereDate('end_date', '>', today())
                ->get(['car_id', 'start_date', 'end_date'])
                ->groupBy(fn (Booking $booking): string => $cars->find($booking->car_id)->slug)
                ->map(fn ($bookings) => $bookings->map(fn (Booking $booking): array => [
                    'start_date' => $booking->start_date->toDateString(),
                    'end_date' => $booking->end_date->toDateString(),
                ])->values())
                ->all(),
            'blocks' => CarBlockResource::collection(
                CarBlock::query()->whereIn('car_id', $cars->modelKeys())->upcoming()->with('car')->get(),
            ),
        ];
    }
}
