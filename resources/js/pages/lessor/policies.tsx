import { Form, Head, Link } from '@inertiajs/react';
import { Info, ShieldCheck, Store } from 'lucide-react';
import { useState } from 'react';
import PolicyController from '@/actions/App/Http/Controllers/Lessor/PolicyController';
import { EmptyState } from '@/components/empty-state';
import { FormField } from '@/components/form-field';
import { FormSaveBar } from '@/components/form-save-bar';
import { FormSection } from '@/components/lessor/form-section';
import { PageHeader } from '@/components/lessor/page-header';
import { OptionSelect } from '@/components/option-select';
import { BrandButton } from '@/components/public/brand-button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { UnitInput } from '@/components/unit-input';
import { Textarea } from '@/components/ui/textarea';
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
};

const cancellationExplanations: Record<
    Policies['renter_cancellation'],
    string
> = {
    anytime:
        'Renters can cancel a confirmed booking from their booking link any time before pickup.',
    notice: 'Renters can cancel from their booking link until the cutoff below. After that they have to call or message you.',
    never: 'Renters can only view their booking. To change or cancel it they have to call or message you.',
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

            <div className="mx-auto w-full max-w-4xl space-y-8 p-4 md:p-8">
                <PageHeader
                    eyebrow="Your rules"
                    title="Policies"
                    description="Decide when renters pick up, what they can do themselves, and what they agree to when booking."
                />

                {policies ? (
                    <Form
                        {...PolicyController.update.form()}
                        options={{ preserveScroll: true }}
                        className="space-y-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <FormSection
                                    step={1}
                                    title="Booking policy"
                                    description="When renters usually pick up, and whether they can cancel their own booking from the link we email them."
                                >
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start">
                                            <FormField
                                                id="pickup_time"
                                                label="Usual pickup time"
                                                error={errors.pickup_time}
                                                hint="Philippine time."
                                                className="sm:w-36"
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
                                                id="renter_cancellation"
                                                label="Can renters cancel their own booking?"
                                                error={
                                                    errors.renter_cancellation
                                                }
                                            >
                                                <OptionSelect
                                                    id="renter_cancellation"
                                                    name="renter_cancellation"
                                                    options={
                                                        cancellationOptions
                                                    }
                                                    defaultValue={cancellation}
                                                    onChange={(value) =>
                                                        value &&
                                                        setCancellation(
                                                            value as Policies['renter_cancellation'],
                                                        )
                                                    }
                                                    className="sm:w-72"
                                                />
                                            </FormField>

                                            {cancellation === 'notice' && (
                                                <FormField
                                                    id="cancellation_notice_hours"
                                                    label="Until this long before pickup"
                                                    error={
                                                        errors.cancellation_notice_hours
                                                    }
                                                >
                                                    <div className="relative w-36">
                                                        <Input
                                                            id="cancellation_notice_hours"
                                                            name="cancellation_notice_hours"
                                                            type="number"
                                                            inputMode="numeric"
                                                            min={1}
                                                            max={336}
                                                            defaultValue={
                                                                policies.cancellation_notice_hours
                                                            }
                                                            className="pr-16 tabular-nums"
                                                        />
                                                        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                                                            hours
                                                        </span>
                                                    </div>
                                                </FormField>
                                            )}
                                        </div>

                                        <p className="flex gap-2 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
                                            <Info className="mt-0.5 size-4 shrink-0" />
                                            <span>
                                                {
                                                    cancellationExplanations[
                                                        cancellation
                                                    ]
                                                }{' '}
                                                Requests you haven't confirmed
                                                yet can always be withdrawn.
                                            </span>
                                        </p>

                                        <div className="grid gap-4 rounded-2xl border p-4 sm:grid-cols-3">
                                            <FormField
                                                id="min_rental_days"
                                                label="Shortest rental"
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

                                        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border p-4">
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
                                    </div>
                                </FormSection>

                                <FormSection
                                    step={2}
                                    title="Payment & cancellation policy"
                                    description="Shown when renters book, whichever way they pay. They tick to agree before sending the request."
                                >
                                    <FormField
                                        id="payment_policy"
                                        label="Your policy"
                                        error={errors.payment_policy}
                                    >
                                        <Textarea
                                            id="payment_policy"
                                            name="payment_policy"
                                            rows={5}
                                            defaultValue={
                                                policies.payment_policy ?? ''
                                            }
                                            placeholder="e.g. Free cancellation up to 24 hours before pickup. A ₱1,000 security deposit is collected at pickup and returned with the car."
                                        />
                                    </FormField>
                                </FormSection>

                                <p className="flex gap-3 rounded-3xl border border-dashed p-5 text-sm text-muted-foreground sm:px-8">
                                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                                    <span>
                                        Renter details are kept for{' '}
                                        <strong className="font-semibold text-foreground">
                                            {policies.data_retention_months}{' '}
                                            {policies.data_retention_months ===
                                            1
                                                ? 'month'
                                                : 'months'}
                                        </strong>{' '}
                                        after each trip, then removed
                                        automatically. Rentiva sets this under
                                        its{' '}
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
