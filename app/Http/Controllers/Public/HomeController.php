<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * The owner-facing home page, with the plans owners can pick.
     */
    public function __invoke(): Response
    {
        return Inertia::render('home', [
            'appHost' => config('app.public_domain'),
            'plans' => Plan::query()->where('is_active', true)->orderBy('sort')->orderBy('price')->get()
                ->map(fn (Plan $plan): array => $plan->toCard()),
        ])->withViewData('meta', [
            'title' => config('app.name').' - Booking pages for car rental owners',
            'description' => 'Give your car rental business its own booking page. Renters see only your cars, request dates and pay you at pickup.',
        ]);
    }
}
