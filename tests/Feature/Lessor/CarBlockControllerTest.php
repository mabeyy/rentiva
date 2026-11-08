<?php

use App\Enums\BlockReason;
use App\Models\Booking;
use App\Models\Car;
use App\Models\CarBlock;
use App\Models\Storefront;
use App\Models\User;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

/** A date this many days from today, as Y-m-d. */
function inDays(int $days): string
{
    return today()->addDays($days)->toDateString();
}

describe('managing blocks', function () {
    test('an owner blocks a car\'s dates and sees them on the car and calendar', function () {
        $car = Car::factory()->create();

        $this->actingAs($car->owner)->post(route('lessor.cars.blocks.store', $car), [
            'start_date' => inDays(3),
            'end_date' => inDays(5),
            'reason' => BlockReason::Maintenance->value,
            'note' => 'Change oil',
        ])->assertSessionHasNoErrors();

        expect($car->blocks()->sole())
            ->reason->toBe(BlockReason::Maintenance)
            ->note->toBe('Change oil');

        $this->get(route('lessor.bookings.blocked'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('lessor/bookings/blocked')
                ->where('blocks.0.start_date', inDays(3))
                ->where('blocks.0.end_date', inDays(5))
                ->where('blocks.0.reason.label', 'Maintenance')
                ->where('blocks.0.car.name', $car->name));

        $this->get(route('lessor.bookings.calendar', ['date' => inDays(3)]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('blocks.0.car.name', $car->name)
                ->where('blockOptions.cars.0.slug', $car->slug));

        $this->get(route('lessor.cars.edit', $car))
            ->assertInertia(fn (Assert $page) => $page->where('upcomingBlocksCount', 1));
    });

    test('the blocked list shows only the owner\'s cars, and can narrow to one car', function () {
        $car = Car::factory()->create();
        $otherCar = Car::factory()->for($car->owner, 'owner')->create();
        CarBlock::factory()->for($car)->create();
        CarBlock::factory()->for($otherCar)->create();
        CarBlock::factory()->create();
        CarBlock::factory()->for($car)->create(['start_date' => inDays(-5), 'end_date' => inDays(-3)]);

        $this->actingAs($car->owner)->get(route('lessor.bookings.blocked'))
            ->assertInertia(fn (Assert $page) => $page->has('blocks', 2)->has('blockOptions.cars', 2));

        $this->get(route('lessor.bookings.blocked', ['car' => $car->slug]))
            ->assertInertia(fn (Assert $page) => $page
                ->has('blocks', 1)
                ->where('blocks.0.car.slug', $car->slug)
                ->where('carFilter', $car->slug));
    });

    test('an owner moves and removes a block', function () {
        $block = CarBlock::factory()->create(['start_date' => inDays(3), 'end_date' => inDays(4)]);
        $this->actingAs($block->car->owner);

        $this->put(route('lessor.cars.blocks.update', [$block->car, $block]), [
            'start_date' => inDays(4),
            'end_date' => inDays(6),
            'reason' => BlockReason::PersonalUse->value,
        ])->assertSessionHasNoErrors();

        expect($block->fresh())->end_date->toDateString()->toBe(inDays(6))->reason->toBe(BlockReason::PersonalUse);

        $this->delete(route('lessor.cars.blocks.destroy', [$block->car, $block]))->assertSessionHasNoErrors();

        expect(CarBlock::count())->toBe(0);
    });

    test('blocks can\'t cover a booking renters already hold', function () {
        $car = Car::factory()->create();
        $booking = Booking::factory()->for($car)->confirmed()->between(inDays(5), inDays(8))->create();

        $this->actingAs($car->owner)->post(route('lessor.cars.blocks.store', $car), [
            'start_date' => inDays(7),
            'end_date' => inDays(9),
            'reason' => BlockReason::Maintenance->value,
        ])->assertSessionHasErrors(['start_date' => "Booking {$booking->reference} ({$booking->renter_name}) has the car on some of these days. Cancel or move it first."]);

        // The return day is free: the car is back that morning.
        $this->post(route('lessor.cars.blocks.store', $car), [
            'start_date' => inDays(8),
            'end_date' => inDays(9),
            'reason' => BlockReason::Maintenance->value,
        ])->assertSessionHasNoErrors();
    });

    test('blocks can\'t overlap each other or start in the past', function () {
        $block = CarBlock::factory()->create(['start_date' => inDays(3), 'end_date' => inDays(5)]);
        $this->actingAs($block->car->owner);

        $this->post(route('lessor.cars.blocks.store', $block->car), [
            'start_date' => inDays(5),
            'end_date' => inDays(6),
            'reason' => BlockReason::Other->value,
        ])->assertSessionHasErrors(['start_date' => 'Some of these days are already blocked.']);

        $this->post(route('lessor.cars.blocks.store', $block->car), [
            'start_date' => inDays(-1),
            'end_date' => inDays(1),
            'reason' => BlockReason::Other->value,
        ])->assertSessionHasErrors('start_date');
    });

    test('owners can\'t block or remove blocks on someone else\'s car', function () {
        $block = CarBlock::factory()->create();
        $this->actingAs(User::factory()->create());

        $this->post(route('lessor.cars.blocks.store', $block->car), [
            'start_date' => inDays(40),
            'end_date' => inDays(41),
            'reason' => BlockReason::Other->value,
        ])->assertForbidden();
        $this->delete(route('lessor.cars.blocks.destroy', [$block->car, $block]))->assertForbidden();

        expect(CarBlock::count())->toBe(1);
    });
});

describe('activity log', function () {
    test('blocking, changing and opening dates are logged for the owner and admins', function () {
        $storefront = Storefront::factory()->create();
        $car = Car::factory()->for($storefront->owner, 'owner')->create();
        $this->actingAs($car->owner);

        $this->post(route('lessor.cars.blocks.store', $car), [
            'start_date' => '2026-12-01',
            'end_date' => '2026-12-03',
            'reason' => BlockReason::Maintenance->value,
            'note' => 'Change oil',
        ]);
        $block = $car->blocks()->sole();
        $this->put(route('lessor.cars.blocks.update', [$car, $block]), [
            'start_date' => '2026-12-02',
            'end_date' => '2026-12-04',
            'reason' => BlockReason::Maintenance->value,
            'note' => '',
        ]);
        $this->delete(route('lessor.cars.blocks.destroy', [$car, $block]));

        $this->get(route('lessor.activity'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('events.data', 3)
                ->where('events.data.0.action', 'unblocked')
                ->where('events.data.1.action', 'block_changed')
                ->where('events.data.1.description', 'Dec 2 – 4, 2026 · Maintenance (was Dec 1 – 3, 2026)')
                ->where('events.data.2.action', 'blocked')
                ->where('events.data.2.description', 'Dec 1 – 3, 2026 · Maintenance · Change oil')
                ->where('events.data.2.actor_type', 'owner')
                ->where('events.data.2.car_name', $car->name)
                ->where('events.data.2.reference', null));

        $this->actingAs(User::factory()->admin()->create())
            ->get(route('admin.activity', ['owner' => $storefront->id, 'action' => 'blocked']))
            ->assertInertia(fn (Assert $page) => $page->has('events.data', 1));

        $this->actingAs(Car::factory()->create()->owner)
            ->get(route('lessor.activity'))
            ->assertInertia(fn (Assert $page) => $page->has('events.data', 0));
    });
});

describe('renters', function () {
    test('renters can\'t book over blocked days, but can return on the first one', function () {
        Notification::fake();
        $car = Car::factory()->create();
        CarBlock::factory()->for($car)->create(['start_date' => inDays(5), 'end_date' => inDays(6)]);
        $details = [
            'renter_name' => 'Juan Dela Cruz',
            'renter_email' => 'juan@example.com',
            'renter_phone' => '09171234567',
            'renter_license_number' => 'N01-23-456789',
            'accepted_terms' => '1',
        ];

        $this->post(route('cars.bookings.store', $car), [...$details, 'start_date' => inDays(6), 'end_date' => inDays(8)])
            ->assertSessionHasErrors(['start_date' => 'This car is not available for some of those dates.']);

        $this->post(route('cars.bookings.store', $car), [...$details, 'start_date' => inDays(3), 'end_date' => inDays(5)])
            ->assertSessionHasNoErrors();

        expect(Booking::count())->toBe(1);
    });

    test('blocked cars drop out of date searches and show as unavailable days', function () {
        $car = Car::factory()->create();
        CarBlock::factory()->for($car)->create(['start_date' => inDays(5), 'end_date' => inDays(6)]);

        expect(Car::query()->availableBetween(today()->addDays(4), today()->addDays(6))->exists())->toBeFalse()
            ->and(Car::query()->availableBetween(today()->addDays(7), today()->addDays(9))->exists())->toBeTrue()
            ->and($car->upcomingBookedRanges())->toBe([['start_date' => inDays(5), 'end_date' => inDays(7)]]);
    });
});
