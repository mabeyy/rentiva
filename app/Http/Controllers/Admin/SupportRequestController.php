<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SupportRequestController extends Controller
{
    /**
     * Questions from owners and staff, open ones first.
     */
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString() === 'resolved' ? 'resolved' : 'open';

        return Inertia::render('admin/support', [
            'requests' => JsonResource::collection(SupportRequest::query()
                ->with('user.storefront', 'user.teamMembership.owner.storefront')
                ->when($status === 'open', fn ($query) => $query->whereNull('resolved_at'))
                ->when($status === 'resolved', fn ($query) => $query->whereNotNull('resolved_at'))
                ->latest()
                ->paginate(20)
                ->withQueryString()
                ->through(fn (SupportRequest $supportRequest): array => [
                    'id' => $supportRequest->id,
                    'topic' => $supportRequest->topicLabel(),
                    'reference' => $supportRequest->reference,
                    'message' => $supportRequest->message,
                    'has_screenshot' => $supportRequest->screenshot_path !== null,
                    'sender' => [
                        'name' => $supportRequest->user->name,
                        'email' => $supportRequest->user->email,
                        'business' => $supportRequest->businessName(),
                    ],
                    'created_at' => $supportRequest->created_at->toIso8601String(),
                    'resolved_at' => $supportRequest->resolved_at?->toIso8601String(),
                ])),
            'status' => $status,
            'counts' => [
                'open' => SupportRequest::query()->whereNull('resolved_at')->count(),
                'resolved' => SupportRequest::query()->whereNotNull('resolved_at')->count(),
            ],
        ]);
    }

    /**
     * Mark a request handled (its screenshot is deleted), or open it again.
     */
    public function update(Request $request, SupportRequest $supportRequest): RedirectResponse
    {
        $isResolved = $request->validate(['resolved' => ['required', 'boolean']])['resolved'];

        if ($isResolved && $supportRequest->screenshot_path) {
            Storage::disk('local')->delete($supportRequest->screenshot_path);
            $supportRequest->screenshot_path = null;
        }

        $supportRequest->resolved_at = $isResolved ? now() : null;
        $supportRequest->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => $isResolved ? __('Marked as resolved.') : __('Opened again.')]);

        return back();
    }

    /**
     * The screenshot the sender attached.
     */
    public function screenshot(SupportRequest $supportRequest): StreamedResponse
    {
        abort_unless($supportRequest->screenshot_path && Storage::disk('local')->exists($supportRequest->screenshot_path), 404);

        return Storage::disk('local')->response($supportRequest->screenshot_path);
    }
}
