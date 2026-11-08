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
        ]);
    }
}
