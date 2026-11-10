<?php

namespace App\Http\Controllers\Lessor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lessor\StoreSupportRequestRequest;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HelpController extends Controller
{
    /**
     * How to reach Rentiva, with the priority line for plans that include it.
     */
    public function __invoke(Request $request): Response
    {
        $isPriority = $request->user()->planIncludes('priority_support');

        return Inertia::render('lessor/help', [
            'support' => [
                'email' => Setting::get(Setting::SupportEmail) ?: config('mail.from.address'),
                'phone' => Setting::get(Setting::SupportPhone),
            ],
            'priority' => $isPriority ? [
                'phone' => Setting::get(Setting::PriorityPhone) ?: Setting::get(Setting::SupportPhone),
                'response_hours' => (int) Setting::get(Setting::PriorityResponseHours),
            ] : null,
            'responseHours' => (int) Setting::get(Setting::PriorityResponseHours),
            'topics' => collect(StoreSupportRequestRequest::TOPICS)->map(fn (string $label, string $value): array => ['value' => $value, 'label' => $label])->values(),
            'replyTo' => ($request->attributes->get('staff') ?? $request->user())->email,
            'messageLimits' => ['min' => StoreSupportRequestRequest::MESSAGE_MIN, 'max' => StoreSupportRequestRequest::MESSAGE_MAX],
        ]);
    }
}
