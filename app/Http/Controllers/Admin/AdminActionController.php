<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminActionController extends Controller
{
    /**
     * Everything admins did, newest first: plan changes, suspensions,
     * listing decisions, invoices, reviews, settings and viewing as an owner.
     */
    public function __invoke(Request $request): Response
    {
        $filters = $request->validate([
            'action' => ['nullable', Rule::in(array_keys(AdminAction::ACTIONS))],
            'search' => ['nullable', 'string', 'max:80'],
        ]);

        return Inertia::render('admin/log', [
            'actions' => JsonResource::collection(AdminAction::query()
                ->when($filters['action'] ?? null, fn (Builder $query, string $action) => $query->where('action', $action))
                ->when($filters['search'] ?? null, fn (Builder $query, string $search) => $query->where(fn (Builder $inner) => $inner
                    ->whereLike('admin_name', "%{$search}%")
                    ->orWhereLike('subject_label', "%{$search}%")
                    ->orWhereLike('details', "%{$search}%")))
                ->latest('id')
                ->paginate(30)
                ->withQueryString()
                ->through(fn (AdminAction $action): array => [
                    'id' => $action->id,
                    'admin_name' => $action->admin_name,
                    'action' => AdminAction::ACTIONS[$action->action] ?? $action->action,
                    'subject' => $action->subject_label,
                    'details' => $action->details,
                    'created_at' => $action->created_at?->toIso8601String(),
                ])),
            'filters' => (object) $filters,
            'actionOptions' => collect(AdminAction::ACTIONS)->map(fn (string $label, string $value): array => ['value' => $value, 'label' => $label])->values(),
        ]);
    }
}
