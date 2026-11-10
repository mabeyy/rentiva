<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\Plan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PlanController extends Controller
{
    /**
     * Every plan, with how many owners are on it.
     */
    public function index(): Response
    {
        return Inertia::render('admin/plans', [
            'featureOptions' => collect(Plan::FEATURES)->map(fn (string $label, string $key): array => ['value' => $key, 'label' => $label])->values(),
            'plans' => Plan::query()->withCount('subscriptions')->orderBy('sort')->orderBy('price')->get()
                ->map(fn (Plan $plan): array => [
                    ...$plan->only(['id', 'name', 'description', 'price', 'max_cars', 'max_staff', 'features', 'is_active', 'sort']),
                    'owners_count' => $plan->subscriptions_count,
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        AdminAction::record(Plan::create($this->validated($request)), 'plan_saved', __('Added'));

        return $this->saved(__('Plan added.'));
    }

    public function update(Request $request, Plan $plan): RedirectResponse
    {
        $plan->update($this->validated($request));
        AdminAction::record($plan, 'plan_saved', __('Updated'));

        return $this->saved(__('Plan updated. New prices apply from each owner\'s next invoice.'));
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'description' => ['nullable', 'string', 'max:200'],
            'price' => ['required', 'numeric', 'between:0,1000000'],
            'max_cars' => ['nullable', 'integer', 'between:1,10000'],
            'max_staff' => ['nullable', 'integer', 'between:0,1000'],
            'is_active' => ['boolean'],
            'features' => ['array'],
            'features.*' => [Rule::in(array_keys(Plan::FEATURES))],
            'sort' => ['nullable', 'integer', 'between:0,255'],
        ]);

        return [
            ...$data,
            'price' => (int) round($data['price'] * 100),
            'is_active' => $request->boolean('is_active'),
            'features' => array_values($data['features'] ?? []),
            'sort' => $data['sort'] ?? 0,
        ];
    }

    private function saved(string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return to_route('admin.plans.index');
    }
}
