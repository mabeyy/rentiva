<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Analytics\BuildTrafficReport;
use App\Enums\BookingStatus;
use App\Enums\CarStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Http\Resources\CarResource;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\Setting;
use App\Models\Subscription;
use App\Models\User;
use App\Rules\Turnstile;
use Carbon\CarbonImmutable;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * The number of days shown in the revenue chart.
     */
    private const int REVENUE_DAYS = 14;

    /**
     * The number of upcoming days used to measure utilization.
     */
    private const int UTILIZATION_DAYS = 7;

    /**
     * Show platform-wide health: revenue, moderation queue and utilization.
     */
    public function __invoke(): Response
    {
        return Inertia::render('admin/dashboard', [
            'stats' => [
                'lessors' => User::lessors()->count(),
                'listedCars' => Car::listed()->count(),
                'pendingReview' => Car::where('status', CarStatus::PendingReview)->count(),
                'pendingBookings' => Booking::inStatus(BookingStatus::Pending)->count(),
                'monthRevenue' => (int) Booking::inStatus(BookingStatus::Confirmed, BookingStatus::Completed)
                    ->whereBetween('start_date', [today()->startOfMonth(), today()->endOfMonth()])
                    ->sum('total'),
            ],
            'subscriptions' => $this->subscriptionMetrics(),
            'traffic' => app(BuildTrafficReport::class)->forPlatform(),
            'setup' => $this->setupChecklist(),
            'revenue' => $this->dailyRevenue(),
            'utilization' => $this->utilizationByBodyType(),
            'reviewQueue' => CarResource::collection(
                Car::where('status', CarStatus::PendingReview)->with(['coverImage', 'owner.storefront'])->oldest('updated_at')->limit(5)->get(),
            ),
            'recentBookings' => BookingResource::collection(
                Booking::with('car')->latest()->limit(5)->get(),
            ),
        ]);
    }

    /**
     * Get confirmed and completed booking value per pickup day.
     *
     * @return array<int, array{date: string, total: int}>
     */
    private function dailyRevenue(): array
    {
        $startDate = today()->subDays(self::REVENUE_DAYS - 1);

        $totals = Booking::inStatus(BookingStatus::Confirmed, BookingStatus::Completed)
            ->whereDate('start_date', '>=', $startDate)
            ->whereDate('start_date', '<=', today())
            ->get(['start_date', 'total'])
            ->groupBy(fn (Booking $booking): string => $booking->start_date->toDateString())
            ->map->sum('total');

        return collect(range(0, self::REVENUE_DAYS - 1))
            ->map(function (int $offset) use ($startDate, $totals): array {
                $date = $startDate->addDays($offset)->toDateString();

                return ['date' => $date, 'total' => (int) ($totals[$date] ?? 0)];
            })
            ->all();
    }

    /**
     * Get the share of upcoming days already reserved, per body type.
     *
     * @return array<int, array{body_type: string, utilization: float}>
     */
    private function utilizationByBodyType(): array
    {
        $windowStart = today();
        $windowEnd = today()->addDays(self::UTILIZATION_DAYS);

        $carsPerType = Car::listed()->get(['id', 'body_type'])->countBy(fn (Car $car): string => $car->body_type->label());

        $bookedDaysPerType = Booking::reserving()
            ->overlapping($windowStart, $windowEnd)
            ->with('car:id,body_type')
            ->get(['car_id', 'start_date', 'end_date'])
            ->groupBy(fn (Booking $booking): string => $booking->car->body_type->label())
            ->map->sum(fn (Booking $booking): int => (int) CarbonImmutable::parse(max($booking->start_date, $windowStart))
            ->diffInDays(min($booking->end_date, $windowEnd)));

        return $carsPerType
            ->map(fn (int $cars, string $bodyType): array => [
                'body_type' => $bodyType,
                'utilization' => round(($bookedDaysPerType[$bodyType] ?? 0) / ($cars * self::UTILIZATION_DAYS) * 100, 1),
            ])
            ->sortByDesc('utilization')
            ->values()
            ->all();
    }

    /**
     * How Rentiva itself is earning: recurring revenue, owners per plan, and
     * money waiting to be collected or checked.
     *
     * @return array<string, mixed>
     */
    private function subscriptionMetrics(): array
    {
        $subscriptions = Subscription::query()->whereNotNull('plan_id')->with('plan')->get();
        $unpaid = Invoice::query()->whereIn('status', ['unpaid', 'rejected']);

        return [
            // Yearly plans count as a twelfth of their yearly price each month.
            'mrr' => (int) $subscriptions->sum(fn (Subscription $subscription): float => $subscription->isYearly()
                ? $subscription->plan->yearlyPrice() / 12
                : $subscription->plan->price),
            'paying_owners' => $subscriptions->count(),
            'owners_without_plan' => User::lessors()->whereDoesntHave('subscription', fn ($query) => $query->whereNotNull('plan_id'))->count(),
            'yearly_owners' => $subscriptions->filter->isYearly()->count(),
            'plans' => Plan::query()->orderBy('sort')->orderBy('price')->get()->map(fn (Plan $plan): array => [
                'name' => $plan->name,
                'owners' => $subscriptions->where('plan_id', $plan->id)->count(),
            ]),
            'collected_this_month' => (int) Invoice::query()->where('status', 'paid')->whereBetween('paid_at', [now()->startOfMonth(), now()->endOfMonth()])->sum('amount'),
            'outstanding' => (int) (clone $unpaid)->sum('amount'),
            'overdue_owners' => (clone $unpaid)->whereDate('due_on', '<', today())->distinct()->count('owner_id'),
            'payments_to_check' => Invoice::query()->where('status', 'submitted')->count(),
        ];
    }

    /**
     * What the admin still has to fill in before owners can use everything.
     *
     * @return array<int, array{key: string, label: string, done: bool, href: string}>|null
     */
    private function setupChecklist(): ?array
    {
        $steps = [
            ['key' => 'plans', 'label' => __('Offer at least one plan'), 'done' => Plan::query()->where('is_active', true)->exists(), 'href' => route('admin.plans.index')],
            ['key' => 'accounts', 'label' => __('Add the accounts owners pay you into'), 'done' => filled(Setting::get(Setting::PlatformBankAccounts)), 'href' => route('admin.billing.index')],
            ['key' => 'dpo', 'label' => __('Name your Data Protection Officer'), 'done' => filled(Setting::get(Setting::DpoName)) && filled(Setting::get(Setting::DpoEmail)), 'href' => route('admin.settings.edit')],
            ['key' => 'support', 'label' => __('Add your support email and phone'), 'done' => filled(Setting::get(Setting::SupportEmail)) && filled(Setting::get(Setting::SupportPhone)), 'href' => route('admin.settings.edit')],
            ['key' => 'priority', 'label' => __('Add the priority support line'), 'done' => filled(Setting::get(Setting::PriorityPhone)), 'href' => route('admin.settings.edit')],
            ['key' => 'legal', 'label' => __('Add the registered business name for the privacy notices'), 'done' => filled(Setting::get(Setting::LegalName)), 'href' => route('admin.settings.edit')],
        ];

        // Server settings that fail quietly when missed; set in the host's environment.
        if (app()->isProduction()) {
            array_push(
                $steps,
                ['key' => 'mail', 'label' => __('Set a real mailer (MAIL_MAILER): emails are only being written to the log'), 'done' => ! in_array(config('mail.default'), ['log', 'array'], true), 'href' => route('admin.settings.edit')],
                ['key' => 'mail_from', 'label' => __('Set the sender address (MAIL_FROM_ADDRESS)'), 'done' => config('mail.from.address') !== 'hello@example.com', 'href' => route('admin.settings.edit')],
                ['key' => 'queue', 'label' => __('Use a queue (QUEUE_CONNECTION) and run a worker so emails go out'), 'done' => config('queue.default') !== 'sync', 'href' => route('admin.settings.edit')],
                ['key' => 'turnstile', 'label' => __('Add the Turnstile keys so booking and sign-up forms are protected from bots'), 'done' => Turnstile::isEnabled(), 'href' => route('admin.settings.edit')],
            );
        }

        return collect($steps)->every('done') ? null : $steps;
    }
}
