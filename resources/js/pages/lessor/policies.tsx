import { Form, Head, Link } from '@inertiajs/react';
import { Info, ShieldCheck, Store } from 'lucide-react';
import { useState } from 'react';
import PolicyController from '@/actions/App/Http/Controllers/Lessor/PolicyController';
import { EmptyState } from '@/components/empty-state';
import { FormField } from '@/components/form-field';
import { FormSaveBar } from '@/components/form-save-bar';
import InputError from '@/components/input-error';
import { AmountInput, ExtrasFields } from '@/components/lessor/extras-fields';
import { FormSection } from '@/components/lessor/form-section';
import { PageHeader } from '@/components/lessor/page-header';
import { SectionNav } from '@/components/lessor/section-nav';
import { BrandButton } from '@/components/public/brand-button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { UnitInput } from '@/components/unit-input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { privacy } from '@/routes';
import lessor from '@/routes/lessor';
import type { Option } from '@/types';

type Policies = {
    renter_cancellation: 'anytime' | 'notice' | 'never';
    cancellation_notice_hours: number;
    payment_policy: string | null;
    data_retention_months: number;
    pickup_time: string;
    requires_license_photo: boolean;
    min_rental_days: number;
    advance_notice_hours: number;
    max_advance_days: number;
    default_weekly_discount: number;
    default_monthly_discount: number;
    /** Pesos; null when not offered. */
    default_delivery_fee: string | null;
    default_driver_daily_rate: string | null;
    default_deposit_percent: number;
    /** Pesos; null when not set. */
    damage_participation_fee: string | null;
    damage_policy: string | null;
    /** Cars with their own discounts and extras, which these don't change. */
    cars_with_own_extras: number;
};

/** Pesos from the server to centavos for the fields; null stays "not offered". */
function centavos(pesos: string | null): number | null {
    return pesos === null ? null : Math.round(Number(pesos) * 100);
}

const policySections = [
    { id: 'booking-rules', label: 'Booking rules' },
    { id: 'cancellations', label: 'Cancellations & terms' },
    { id: 'prices', label: 'Discounts, deposit & extras' },
    { id: 'damage', label: 'Damage' },
] as const;

const cancellationExplanations: Record<
    Policies['renter_cancellation'],
    string
> = {
    anytime: 'From their booking link, any time before pickup.',
    notice: 'From their booking link until a cutoff you set. After that they contact you.',
    never: 'They can view their booking, but have to call or message you to cancel.',
};

export default function LessorPolicies({
    policies,
    cancellationOptions,
}: {
    /** Null until the lessor creates their booking page. */
    policies: Policies | null;
    cancellationOptions: Option[];
}) {
    const [cancellation, setCancellation] = useState<
        Policies['renter_cancellation']
    >(policies?.renter_cancellation ?? 'anytime');

    return (
        <>
            <Head title="Policies" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <PageHeader
                    title="Policies"
                    description="Decide when renters pick up, what they can do themselves, and what they agree to when booking."
                />

                {policies ? (
                    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
                        <Form
                            {...PolicyController.update.form()}
                            options={{ preserveScroll: true }}
                            className="space-y-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <FormSection
                                        id="booking-rules"
                                        title="Booking rules"
                                        description="When renters pick up, and how short or far ahead they can book."
                                    >
                                        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                                            <FormField
                                                id="pickup_time"
                                                label="Usual pickup time"
                                                info="Shown to renters and used to time pickup reminders. A renter can still agree a different time with you."
                                                error={errors.pickup_time}
                                                hint="Philippine time."
                                            >
                                                <Input
                                                    id="pickup_time"
                                                    name="pickup_time"
                                                    type="time"
                                                    defaultValue={
                                                        policies.pickup_time
                                                    }
                                                    className="w-36 tabular-nums"
                                                />
                                            </FormField>
                                            <FormField
                                                id="min_rental_days"
                                                label="Shortest rental"
                                                hint="Per booking."
                                                info="Renters can't request fewer days than this. Bookings you add yourself aren't limited."
                                                error={errors.min_rental_days}
                                            >
                                                <UnitInput
                                                    id="min_rental_days"
                                                    name="min_rental_days"
                                                    defaultValue={
                                                        policies.min_rental_days
                                                    }
                                                    unit="days"
                                                    min={1}
                                                    max={30}
                                                />
                                            </FormField>
                                            <FormField
                                                id="advance_notice_hours"
                                                label="Book at least"
                                                info="How much notice you need before a pickup. With 24 hours, a renter can't book a pickup for later today."
                                                error={
                                                    errors.advance_notice_hours
                                                }
                                                hint="Before pickup. 0 allows same-day."
                                            >
                                                <UnitInput
                                                    id="advance_notice_hours"
                                                    name="advance_notice_hours"
                                                    defaultValue={
                                                        policies.advance_notice_hours
                                                    }
                                                    unit="hours"
                                                    min={0}
                                                    max={168}
                                                />
                                            </FormField>
                                            <FormField
                                                id="max_advance_days"
                                                label="Book up to"
                                                info="How far ahead renters can book. Later dates are greyed out on your booking page."
                                                error={errors.max_advance_days}
                                                hint="Days ahead."
                                            >
                                                <UnitInput
                                                    id="max_advance_days"
                                                    name="max_advance_days"
                                                    defaultValue={
                                                        policies.max_advance_days
                                                    }
                                                    unit="days"
                                                    min={7}
                                                    max={730}
                                                />
                                            </FormField>
                                        </div>

                                        <label className="mt-6 flex cursor-pointer items-start justify-between gap-4 border-t pt-5">
                                            <span>
                                                <span className="block text-sm font-medium">
                                                    Require a photo of the
                                                    driver's license
                                                </span>
                                                <span className="block text-sm text-muted-foreground">
                                                    Renters upload it when they
                                                    book, so you can check it
                                                    before confirming. Only you
                                                    see it.
                                                </span>
                                            </span>
                                            <Switch
                                                name="requires_license_photo"
                                                value="1"
                                                defaultChecked={
                                                    policies.requires_license_photo
                                                }
                                                className="data-[state=checked]:bg-brand"
                                            />
                                        </label>
                                    </FormSection>

                                    <FormSection
                                        id="cancellations"
                                        title="Cancellations & payment terms"
                                        description="Whether renters can cancel from the link we email them, and the terms they agree to when booking."
                                    >
                                        <fieldset className="space-y-2">
                                            <legend className="mb-2 text-sm font-medium">
                                                Can renters cancel their own
                                                booking?
                                            </legend>
                                            <div className="grid gap-2 md:grid-cols-3">
                                                {cancellationOptions.map(
                                                    (option) => {
                                                        const value =
                                                            option.value as Policies['renter_cancellation'];
                                                        const isChosen =
                                                            cancellation ===
                                                            value;

                                                        return (
                                                            <label
                                                                key={value}
                                                                className={cn(
                                                                    'flex cursor-pointer flex-col gap-1 rounded-2xl border p-4 transition-colors hover:border-foreground/30 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50',
                                                                    isChosen &&
                                                                        'border-brand/60 bg-brand/5 hover:border-brand/60',
                                                                )}
                                                            >
                                                                <span className="flex items-center gap-2 text-sm font-medium">
                                                                    <input
                                                                        type="radio"
                                                                        name="renter_cancellation"
                                                                        value={
                                                                            value
                                                                        }
                                                                        checked={
                                                                            isChosen
                                                                        }
                                                                        onChange={() =>
                                                                            setCancellation(
                                                                                value,
                                                                            )
                                                                        }
                                                                        className="size-4 accent-brand"
                                                                    />
                                                                    {
                                                                        option.label
                                                                    }
                                                                </span>
                                                                <span className="pl-6 text-xs text-muted-foreground">
                                                                    {
                                                                        cancellationExplanations[
                                                                            value
                                                                        ]
                                                                    }
                                                                </span>
                                                            </label>
                                                        );
                                                    },
                                                )}
                                            </div>
                                            <InputError
                                                message={
                                                    errors.renter_cancellation
                                                }
                                            />
                                        </fieldset>

                                        {cancellation === 'notice' && (
                                            <FormField
                                                id="cancellation_notice_hours"
                                                label="Renters can cancel until"
                                                error={
                                                    errors.cancellation_notice_hours
                                                }
                                                hint="Before pickup. After that they have to call or message you."
                                                className="mt-5"
                                            >
                                                <UnitInput
                                                    id="cancellation_notice_hours"
                                                    name="cancellation_notice_hours"
                                                    defaultValue={
                                                        policies.cancellation_notice_hours
                                                    }
                                                    unit="hours"
                                                    min={1}
                                                    max={336}
                                                />
                                            </FormField>
                                        )}
                                        <p className="mt-3 text-xs text-muted-foreground">
                                            Requests you haven't confirmed yet
                                            can always be withdrawn.
                                        </p>

                                        <FormField
                                            id="payment_policy"
                                            label="Payment & cancellation terms"
                                            info="Shown when renters book, whichever way they pay. They tick to agree before sending the request."
                                            error={errors.payment_policy}
                                            hint="Renters tick to agree to this before sending a request."
                                            className="mt-6 border-t pt-5"
                                        >
                                            <Textarea
                                                id="payment_policy"
                                                name="payment_policy"
                                                rows={4}
                                                defaultValue={
                                                    policies.payment_policy ??
                                                    ''
                                                }
                                                placeholder="e.g. Free cancellation up to 24 hours before pickup. Late returns are charged ₱300 per hour."
                                            />
                                        </FormField>
                                    </FormSection>

                                    <FormSection
                                        id="prices"
                                        title="Discounts, deposit & extras"
                                        description="Set once for every car. A car can still have its own, from its edit page."
                                    >
                                        <ExtrasFields
                                            prefix="default_"
                                            errors={errors}
                                            values={{
                                                weekly_discount:
                                                    policies.default_weekly_discount,
                                                monthly_discount:
                                                    policies.default_monthly_discount,
                                                deposit_percent:
                                                    policies.default_deposit_percent,
                                                delivery_fee: centavos(
                                                    policies.default_delivery_fee,
                                                ),
                                                driver_daily_rate: centavos(
                                                    policies.default_driver_daily_rate,
                                                ),
                                            }}
                                        />
                                        {policies.cars_with_own_extras > 0 && (
                                            <p className="mt-5 flex gap-2 text-xs text-muted-foreground">
                                                <Info className="size-4 shrink-0" />
                                                <span>
                                                    {policies.cars_with_own_extras ===
                                                    1
                                                        ? '1 car has its own discounts and extras, so it won’t change.'
                                                        : `${policies.cars_with_own_extras} cars have their own discounts and extras, so they won’t change.`}{' '}
                                                    Every other car updates when
                                                    you save.
                                                </span>
                                            </p>
                                        )}
                                    </FormSection>

                                    <FormSection
                                        id="damage"
                                        title="If the car is damaged"
                                        description="Optional. Renters agree to this when they book, and it's printed on the rental agreement."
                                    >
                                        <div className="grid gap-5 lg:grid-cols-[14rem_minmax(0,1fr)]">
                                            <FormField
                                                id="damage_participation_fee"
                                                label="Renter pays first"
                                                error={
                                                    errors.damage_participation_fee
                                                }
                                                hint="Leave blank if you don't charge one."
                                                info="Like an insurance participation fee: the renter covers this amount of any damage, and your insurance or deposit covers the rest. Common amounts are ₱3,000 to ₱5,000."
                                            >
                                                <AmountInput
                                                    id="damage_participation_fee"
                                                    unit="₱"
                                                    step={500}
                                                    defaultValue={
                                                        policies.damage_participation_fee ??
                                                        ''
                                                    }
                                                    placeholder="None"
                                                />
                                            </FormField>
                                            <FormField
                                                id="damage_policy"
                                                label="Damage terms"
                                                error={errors.damage_policy}
                                                hint="Optional."
                                            >
                                                <Textarea
                                                    id="damage_policy"
                                                    name="damage_policy"
                                                    rows={3}
                                                    maxLength={1000}
                                                    defaultValue={
                                                        policies.damage_policy ??
                                                        ''
                                                    }
                                                    placeholder="e.g. The renter also pays for damage our insurance doesn't cover, and for the days the car is in the shop."
                                                />
                                            </FormField>
                                        </div>
                                    </FormSection>

                                    <p className="flex gap-2 px-1 text-xs text-muted-foreground">
                                        <ShieldCheck className="size-4 shrink-0 text-brand" />
                                        <span>
                                            Renter details are kept for{' '}
                                            {policies.data_retention_months}{' '}
                                            {policies.data_retention_months ===
                                            1
                                                ? 'month'
                                                : 'months'}{' '}
                                            after each trip, then removed
                                            automatically, as set in Rentiva's{' '}
                                            <Link
                                                href={privacy()}
                                                className="font-medium text-foreground underline underline-offset-4"
                                            >
                                                privacy policy
                                            </Link>
                                            .
                                        </span>
                                    </p>

                                    <FormSaveBar
                                        label="Save policies"
                                        hint="Applies to bookings right away."
                                        processing={processing}
                                    />
                                </>
                            )}
                        </Form>

                        <SectionNav sections={policySections} />
                    </div>
                ) : (
                    <EmptyState
                        icon={Store}
                        title="Set up your booking page first"
                        description="Policies are shown on your booking page, so create it before setting them."
                        action={
                            <BrandButton className="rounded-full px-5" asChild>
                                <Link href={lessor.storefront.edit()}>
                                    Create booking page
                                </Link>
                            </BrandButton>
                        }
                    />
                )}
            </div>
        </>
    );
}

LessorPolicies.layout = {
    breadcrumbs: [{ title: 'Policies', href: lessor.policies.edit() }],
};
