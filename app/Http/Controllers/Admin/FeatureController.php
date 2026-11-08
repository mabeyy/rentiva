<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveFeatureRequest;
use App\Http\Resources\FeatureResource;
use App\Models\Feature;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class FeatureController extends Controller
{
    /**
     * List the features lessors can pick from.
     */
    public function index(): Response
    {
        return Inertia::render('admin/features/index', [
            'features' => FeatureResource::collection(Feature::withCount('cars')->orderBy('name')->get()),
        ]);
    }

    /**
     * Add a feature to the catalog.
     */
    public function store(SaveFeatureRequest $request): RedirectResponse
    {
        Feature::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Feature added.')]);

        return back();
    }

    /**
     * Rename a feature.
     */
    public function update(SaveFeatureRequest $request, Feature $feature): RedirectResponse
    {
        $feature->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Feature renamed.')]);

        return back();
    }

    /**
     * Remove a feature from the catalog and every car.
     */
    public function destroy(Feature $feature): RedirectResponse
    {
        $feature->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Feature removed.')]);

        return back();
    }
}
