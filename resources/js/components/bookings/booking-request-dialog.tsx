import { Form, usePage } from '@inertiajs/react';
import { Banknote, IdCard, Landmark, Truck, UserRound } from 'lucide-react';
import { useState } from 'react';
import BookingController from '@/actions/App/Http/Controllers/Public/BookingController';
import { BookingSummary } from '@/components/bookings/booking-summary';
import { FormField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { TurnstileWidget } from '@/components/turnstile-widget';
import { calculateBookingQuote } from '@/lib/booking-quote';
import { formatDateRange, formatPeso, toIsoDate } from '@/lib/format';
import { defaultPaymentMethods, totalLabelFor } from '@/lib/payment';
import { cn } from '@/lib/utils';
import { terms } from '@/routes';
import storefronts from '@/routes/storefronts';
import type { Car, PaymentMethod, Storefront } from '@/types';

export function BookingRequestDialog({
    car,
    range,
    open,
    onOpenChange,
}: {
    car: Car;
    range: { from: Date; to: Date };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const storefront = usePage<{ storefront?: Storefront }>().props.storefront;
    const paymentMethods = storefront?.payment_methods ?? defaultPaymentMethods;
    const policy = storefront?.payment_policy;
    const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0].value);
    const [withDelivery, setWithDelivery] = useState(false);
    const [withDriver, setWithDriver] = useState(false);
    const quote = calculateBookingQuote(car, range, {
        withDelivery,
        withDriver,
        seasons: storefront?.peak_seasons,
    });
    const requiresLicensePhoto = storefront?.requires_license_photo ?? false;
    const startDate = toIsoDate(range.from);
    const endDate = toIsoDate(range.to);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Request {car.name}</DialogTitle>
                    <DialogDescription>
                        {formatDateRange(startDate, endDate)}. No account
                        needed: we email you a link to manage your booking.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...BookingController.store.form(car.slug)}
                    options={{ preserveScroll: true }}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <input
                                type="hidden"
                                name="start_date"
                                value={startDate}
                            />
                            <input
                                type="hidden"
                                name="end_date"
                                value={endDate}
                            />
                            <InputError
                                message={errors.start_date ?? errors.end_date}
                            />

                            <FormField
                                id="renter_name"
                                label="Full name"
                                error={errors.renter_name}
                            >
                                <Input
                                    id="renter_name"
                                    name="renter_name"
                                    required
                                    autoComplete="name"
                                />
                            </FormField>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    id="renter_email"
                                    label="Email"
                                    error={errors.renter_email}
                                >
                                    <Input
                                        id="renter_email"
                                        name="renter_email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                    />
                                </FormField>
                                <FormField
                                    id="renter_phone"
                                    label="Mobile number"
                                    error={errors.renter_phone}
                                >
                                    <Input
                                        id="renter_phone"
                                        name="renter_phone"
                                        required
                                        autoComplete="tel"
                                        placeholder="09171234567"
                                    />
                                </FormField>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    id="renter_license_number"
                                    label="Driver's license number"
                                    error={errors.renter_license_number}
                                    hint="Bring the physical license at pickup."
                                >
                                    <Input
                                        id="renter_license_number"
                                        name="renter_license_number"
                                        required
                                    />
                                </FormField>
                                <FormField
                                    id="license_photo"
                                    label={
                                        requiresLicensePhoto
                                            ? 'Photo of your license'
                                            : 'Photo of your license (optional)'
                                    }
                                    error={errors.license_photo}
                                    hint="Only the owner sees it."
                                >
                                    <label
                                        htmlFor="license_photo"
                                        className="flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/30 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50"
                                    >
                                        <IdCard className="size-4 shrink-0" />
                                        <input
                                            id="license_photo"
                                            name="license_photo"
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            required={requiresLicensePhoto}
                                            className="w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-muted file:px-2 file:py-0.5 file:text-xs file:font-medium"
                                        />
                                    </label>
                                </FormField>
                            </div>

                            {(car.delivery_fee !== null ||
                                car.driver_daily_rate !== null) && (
                                <fieldset className="space-y-2">
                                    <legend className="mb-2 text-sm font-medium">
                                        Extras
                                    </legend>
                                    {car.driver_daily_rate !== null && (
                                        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-colors has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand/5">
                                            <Checkbox
                                                name="with_driver"
                                                value="1"
                                                checked={withDriver}
                                                onCheckedChange={(checked) =>
                                                    setWithDriver(
                                                        checked === true,
                                                    )
                                                }
                                            />
                                            <UserRound className="size-4 shrink-0 text-brand" />
                                            <span className="flex-1 text-sm font-medium">
                                                With a driver
                                            </span>
                                            <span className="text-sm text-muted-foreground tabular-nums">
                                                {formatPeso(
                                                    car.driver_daily_rate,
                                                )}
                                                /day
                                            </span>
                                        </label>
                                    )}
                                    {car.delivery_fee !== null && (
                                        <div className="rounded-2xl border p-3 transition-colors has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand/5">
                                            <label className="flex cursor-pointer items-center gap-3">
                                                <Checkbox
                                                    name="with_delivery"
                                                    value="1"
                                                    checked={withDelivery}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        setWithDelivery(
                                                            checked === true,
                                                        )
                                                    }
                                                />
                                                <Truck className="size-4 shrink-0 text-brand" />
                                                <span className="flex-1 text-sm font-medium">
                                                    Deliver it to me
                                                </span>
                                                <span className="text-sm text-muted-foreground tabular-nums">
                                                    {car.delivery_fee === 0
                                                        ? 'Free'
                                                        : formatPeso(
                                                              car.delivery_fee,
                                                          )}
                                                </span>
                                            </label>
                                            {withDelivery && (
                                                <div className="mt-3">
                                                    <Input
                                                        name="delivery_address"
                                                        aria-label="Delivery address"
                                                        required
                                                        placeholder="Hotel, street address or landmark"
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.delivery_address
                                                        }
                                                        className="mt-1"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </fieldset>
                            )}
                            <FormField
                                id="notes"
                                label="Note to the owner (optional)"
                                error={errors.notes}
                            >
                                <Textarea
                                    id="notes"
                                    name="notes"
                                    rows={3}
                                    placeholder="Pickup time, special requests…"
                                />
                            </FormField>

                            <fieldset className="space-y-2">
                                <legend className="mb-2 text-sm font-medium">
                                    How will you pay?
                                </legend>
                                <input
                                    type="hidden"
                                    name="payment_method"
                                    value={paymentMethod}
                                />
                                <div
                                    role="radiogroup"
                                    className="grid gap-2 sm:grid-cols-2"
                                >
                                    {paymentMethods.map((method) => {
                                        const isChosen =
                                            method.value === paymentMethod;
                                        const Icon =
                                            method.value === 'bank_transfer'
                                                ? Landmark
                                                : Banknote;

                                        return (
                                            <button
                                                key={method.value}
                                                type="button"
                                                role="radio"
                                                aria-checked={isChosen}
                                                onClick={() =>
                                                    setPaymentMethod(
                                                        method.value,
                                                    )
                                                }
                                                className={cn(
                                                    'flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand',
                                                    isChosen
                                                        ? 'border-brand bg-brand/5'
                                                        : 'hover:border-foreground/30',
                                                )}
                                            >
                                                <Icon className="mt-0.5 size-4 shrink-0 text-brand" />
                                                <span>
                                                    <span className="block text-sm font-medium">
                                                        {method.label}
                                                    </span>
                                                    <span className="block text-xs text-muted-foreground">
                                                        {method.value ===
                                                        'bank_transfer'
                                                            ? 'Transfer after the owner confirms.'
                                                            : 'Pay the owner when you collect the car.'}
                                                    </span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <InputError message={errors.payment_method} />
                            </fieldset>

                            {quote && (
                                <BookingSummary
                                    quote={quote}
                                    totalLabel={totalLabelFor(
                                        paymentMethod as PaymentMethod,
                                    )}
                                />
                            )}

                            {policy && (
                                <div className="rounded-2xl border bg-muted/30 p-4">
                                    <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                                        Payment & cancellation policy
                                    </p>
                                    <p className="mt-1.5 max-h-40 overflow-y-auto text-sm whitespace-pre-line">
                                        {policy}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-1">
                                <div className="flex items-start gap-2">
                                    <Checkbox
                                        id="accepted_terms"
                                        name="accepted_terms"
                                        value="1"
                                    />
                                    <Label
                                        htmlFor="accepted_terms"
                                        className="leading-snug font-normal"
                                    >
                                        I am at least 21, hold a valid driver's
                                        license, and agree to pay the owner the
                                        total shown above
                                        {policy
                                            ? ' and to their payment & cancellation policy.'
                                            : '.'}
                                        {storefront && (
                                            <>
                                                {' '}
                                                See how your details are handled
                                                in the{' '}
                                                <a
                                                    href={
                                                        storefronts.privacy(
                                                            storefront.slug,
                                                        ).url
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="underline underline-offset-2"
                                                >
                                                    privacy notice
                                                </a>
                                                .
                                            </>
                                        )}{' '}
                                        You also agree to the{' '}
                                        <a
                                            href={terms().url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline underline-offset-2"
                                        >
                                            terms of service
                                        </a>
                                        .
                                    </Label>
                                </div>
                                <InputError message={errors.accepted_terms} />
                            </div>

                            <TurnstileWidget errors={errors} />

                            <DialogFooter>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full sm:w-auto"
                                >
                                    {processing && <Spinner />}
                                    Send booking request
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
