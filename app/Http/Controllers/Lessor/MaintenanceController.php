<?php

namespace App\Http\Controllers\Lessor;

use App\Http\Controllers\Controller;
use App\Models\Car;
use App\Models\CarService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MaintenanceController extends Controller
{
    /**
     * A car with no service logged in this many days is flagged as due.
     */
    public const int SERVICE_DUE_AFTER_DAYS = 180;

    /**
     * A registration running out within this many days is flagged.
     */
    public const int REGISTRATION_WARNING_DAYS = 30;

    /**
     * Upkeep across the whole fleet: each car's last service and
     * registration, what was spent this year, and which cars need attention
     * first.
     */
    public function __invoke(Request $request): Response
    {
        $startOfYear = today()->startOfYear();
        $cars = $request->user()->cars()
            ->with(['services' => fn ($services) => $services->limit(20)])
            ->oldest('make')
            ->oldest('model')
            ->get()
            ->map(fn (Car $car): array => $this->present($car, $startOfYear->toDateString()))
            ->sortByDesc(fn (array $car): int => (int) $car['needs_attention'])
            ->values();

        return Inertia::render('lessor/maintenance', [
            'cars' => $cars,
            'summary' => [
                'spent_this_year' => (int) CarService::query()
                    ->whereIn('car_id', $request->user()->cars()->select('id'))
                    ->whereDate('serviced_on', '>=', $startOfYear)
                    ->sum('cost'),
                'services_this_year' => CarService::query()
                    ->whereIn('car_id', $request->user()->cars()->select('id'))
                    ->whereDate('serviced_on', '>=', $startOfYear)
                    ->count(),
                'needs_attention' => $cars->where('needs_attention', true)->count(),
            ],
            'serviceDueAfterDays' => self::SERVICE_DUE_AFTER_DAYS,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(Car $car, string $startOfYear): array
    {
        $latest = $car->services->first();
        $daysSinceService = $latest ? (int) $latest->serviced_on->diffInDays(today()) : null;
        $registrationDaysLeft = $car->registration_expires_on ? (int) today()->diffInDays($car->registration_expires_on, false) : null;
        $serviceDue = $daysSinceService === null || $daysSinceService >= self::SERVICE_DUE_AFTER_DAYS;
        $registrationDue = $registrationDaysLeft !== null && $registrationDaysLeft <= self::REGISTRATION_WARNING_DAYS;

        return [
            'slug' => $car->slug,
            'name' => $car->name,
            'plate_number' => $car->plate_number,
            'days_since_service' => $daysSinceService,
            'service_due' => $serviceDue,
            'registration_expires_on' => $car->registration_expires_on?->toDateString(),
            'registration_days_left' => $registrationDaysLeft,
            'needs_attention' => $serviceDue || $registrationDue,
            'spent_this_year' => (int) $car->services->filter(fn (CarService $service): bool => $service->serviced_on->toDateString() >= $startOfYear)->sum('cost'),
            'services' => $car->services->map(fn (CarService $service): array => [
                'id' => $service->id,
                'serviced_on' => $service->serviced_on->toDateString(),
                'odometer' => $service->odometer,
                'description' => $service->description,
                'cost' => $service->cost,
            ])->all(),
        ];
    }
}
