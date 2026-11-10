import { Link } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { BrandButton } from '@/components/public/brand-button';
import { Button } from '@/components/ui/button';
import { formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';
import { register } from '@/routes';

export type PlanFeature = { key: string; label: string; included: boolean };

export type PublicPlan = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    yearly_price: number;
    max_cars: number | null;
    max_staff: number | null;
    features: PlanFeature[];
};

export type BillingCycle = 'monthly' | 'yearly';

/** What every plan includes, shown once under the cards. */
const included = [
    'Your own booking page and link',
    'Unlimited bookings, no commission',
    'Every booking and payment email to renters',
    "Driver's license photo checks",
    'Calendar, renters and reviews',
    'Receipts, agreements and CSV exports',
];

/** "₱1,499" without the centavos. */
function peso(centavos: number): string {
    return formatPeso(centavos).replace(/\.00$/, '');
}

export function planLimits(plan: PublicPlan): string[] {
    return [
        plan.max_cars === null
            ? 'Unlimited cars'
            : `Up to ${plan.max_cars} cars`,
        plan.max_staff === null
            ? 'Unlimited staff accounts'
            : plan.max_staff === 0
              ? 'Just you, no staff accounts'
              : `Up to ${plan.max_staff} staff accounts`,
    ];
}

/**
 * What a plan adds over the one before it, so each card only lists what's
 * new ("Everything in Growth, plus…").
 */
export function newFeatures(plan: PublicPlan, previous?: PublicPlan): string[] {
    return plan.features
        .filter(
            (feature) =>
                feature.included &&
                !previous?.features.find((other) => other.key === feature.key)
                    ?.included,
        )
        .map((feature) => feature.label);
}

/** Monthly or yearly (two months free), as a two-option switch. */
export function CycleToggle({
    cycle,
    onChange,
}: {
    cycle: BillingCycle;
    onChange: (cycle: BillingCycle) => void;
}) {
    return (
        <div
            role="radiogroup"
            aria-label="Billing"
            className="inline-flex items-center rounded-full border bg-background p-1 text-sm"
        >
            {(['monthly', 'yearly'] as const).map((option) => (
                <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={cycle === option}
                    onClick={() => onChange(option)}
                    className={cn(
                        'flex items-center gap-2 rounded-full px-4 py-1.5 font-medium transition-colors',
                        cycle === option
                            ? 'bg-ink text-ink-foreground'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {option === 'monthly' ? 'Monthly' : 'Yearly'}
                    {option === 'yearly' && (
                        <span
                            className={cn(
                                'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                cycle === option
                                    ? 'bg-white/15'
                                    : 'bg-brand/10 text-brand',
                            )}
                        >
                            2 months free
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}

/** The price block for a plan in the chosen cycle. */
export function PlanPrice({
    plan,
    cycle,
}: {
    plan: PublicPlan;
    cycle: BillingCycle;
}) {
    const perMonth =
        cycle === 'yearly' ? Math.round(plan.yearly_price / 12) : plan.price;

    return (
        <div>
            <p className="flex items-baseline gap-1">
                <span className="font-display text-5xl font-extrabold tracking-tight tabular-nums">
                    {peso(perMonth)}
                </span>
                <span className="text-muted-foreground">/month</span>
            </p>
            <p className="mt-1 h-5 text-sm text-muted-foreground">
                {cycle === 'yearly'
                    ? `${peso(plan.yearly_price)} billed yearly`
                    : 'Billed monthly'}
            </p>
        </div>
    );
}

/**
 * The plans on the home page. Each card lists only what it adds over the plan
 * before it; the middle plan is highlighted when there are three or more.
 */
export function PricingSection({ plans }: { plans: PublicPlan[] }) {
    const [cycle, setCycle] = useState<BillingCycle>('monthly');

    if (plans.length === 0) {
        return null;
    }

    const featuredIndex = plans.length >= 3 ? Math.floor(plans.length / 2) : -1;

    return (
        <section id="pricing" className="scroll-mt-20 bg-background">
            <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
                        Pricing
                    </p>
                    <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                        One flat price. Every booking is yours.
                    </h2>
                    <p className="mt-3 text-lg text-muted-foreground">
                        Pay monthly or yearly and keep every peso you earn. We
                        never take a commission.
                    </p>
                    <div className="mt-6">
                        <CycleToggle cycle={cycle} onChange={setCycle} />
                    </div>
                </div>

                <div
                    className={cn(
                        'mx-auto mt-12 grid gap-6',
                        plans.length === 1 && 'max-w-sm',
                        plans.length === 2 && 'max-w-3xl md:grid-cols-2',
                        plans.length >= 3 && 'md:grid-cols-3',
                    )}
                >
                    {plans.map((plan, index) => {
                        const isFeatured = index === featuredIndex;
                        const previous = plans[index - 1];
                        const additions = newFeatures(plan, previous);

                        return (
                            <div
                                key={plan.id}
                                className={cn(
                                    'relative flex flex-col rounded-3xl border bg-background p-7',
                                    isFeatured &&
                                        'border-brand shadow-[0_24px_48px_-24px_color-mix(in_oklch,var(--brand)_45%,transparent)] md:-my-3 md:py-10',
                                )}
                            >
                                {isFeatured && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground">
                                        Most popular
                                    </span>
                                )}
                                <h3 className="font-display text-xl font-bold">
                                    {plan.name}
                                </h3>
                                {plan.description && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {plan.description}
                                    </p>
                                )}
                                <div className="mt-6">
                                    <PlanPrice plan={plan} cycle={cycle} />
                                </div>

                                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                                    {planLimits(plan).map((line) => (
                                        <li
                                            key={line}
                                            className="flex items-center gap-2 font-medium"
                                        >
                                            <Check className="size-4 shrink-0 text-brand" />
                                            {line}
                                        </li>
                                    ))}
                                    {previous ? (
                                        <li className="pt-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            Everything in {previous.name}, plus
                                        </li>
                                    ) : (
                                        <li className="pt-2 text-muted-foreground">
                                            All the essentials listed below.
                                        </li>
                                    )}
                                    {additions.map((label) => (
                                        <li
                                            key={label}
                                            className="flex items-center gap-2"
                                        >
                                            <Check className="size-4 shrink-0 text-brand" />
                                            {label}
                                        </li>
                                    ))}
                                </ul>

                                {isFeatured ? (
                                    <BrandButton
                                        size="lg"
                                        className="mt-8 h-12 rounded-full text-base"
                                        asChild
                                    >
                                        <Link href={register()}>
                                            Get started
                                        </Link>
                                    </BrandButton>
                                ) : (
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="mt-8 h-12 rounded-full text-base"
                                        asChild
                                    >
                                        <Link href={register()}>
                                            Get started
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mx-auto mt-10 max-w-5xl rounded-3xl bg-muted/40 px-6 py-5">
                    <p className="text-center text-sm font-semibold">
                        Every plan includes
                    </p>
                    <ul className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                        {included.map((line) => (
                            <li
                                key={line}
                                className="flex items-center gap-1.5"
                            >
                                <Check className="size-4 shrink-0 text-brand" />
                                {line}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
