import { Link, useForm, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Banknote,
    Ellipsis,
    Footprints,
    Landmark,
    MessageCircle,
    Phone,
    Store,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { BookingSummary } from '@/components/bookings/booking-summary';
import { DateRangePicker } from '@/components/date-range-picker';
import { EmptyState } from '@/components/empty-state';
import { FormField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { OptionSelect } from '@/components/option-select';
import { BrandButton } from '@/components/public/brand-button';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import type { Season } from '@/lib/booking-quote';
import { calculateBookingQuote } from '@/lib/booking-quote';
import { formatPeso, toIsoDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';
import type { BookedRange, Car, Option } from '@/types';
import { FilePicker } from '@/components/file-picker';

type BookableCar = Pick<
    Car,
    | 'slug'
    | 'name'
    | 'daily_rate'
    | 'deposit_percent'
    | 'weekly_discount'
    | 'monthly_discount'
    | 'delivery_fee'
    | 'driver_daily_rate'
> & { booked_ranges: BookedRange[] };

/** What the server sends for the form (ManualBookingController::formOptions). */
export type ManualBookingOptions = {
    seasons: Season[];
    cars: BookableCar[];
    sources: Option[];
    paymentMethods: Option[];
    hasStorefront: boolean;
};

/** Icons for the "how they booked" and payment choices, by option value. */
const choiceIcons: Record<string, LucideIcon> = {
    phone: Phone,
    messenger: MessageCircle,
    walk_in: Footprints,
    other: Ellipsis,
    pickup: Banknote,
    bank_transfer: Landmark,
};

/**
 * Pick one of a few options, laid out as equal tiles that fill the row,
 * each with an icon; the chosen one is outlined in the brand colour.
 */
function Choice({
    id,
    options,
    value,
    onChange,
}: {
    id: string;
    options: Option[];
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div
            id={id}
            role="radiogroup"
            className="grid grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-2"
        >
            {options.map((option) => {
                const isChosen = value === option.value;
                const Icon = choiceIcons[option.value] ?? Ellipsis;

                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={isChosen}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                            isChosen
                                ? 'border-brand bg-brand/5 ring-1 ring-brand'
                                : 'hover:border-foreground/25 hover:bg-muted/40',
                        )}
                    >
                        <Icon
                            className={cn(
                                'size-4 shrink-0',
                                isChosen
                                    ? 'text-brand'
                                    : 'text-muted-foreground',
                            )}
                        />
                        <span className="min-w-0 flex-1 leading-snug">
                            {option.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

/** A titled group of fields. */
function Section({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <section className="space-y-4 border-t pt-5 first:border-t-0 first:pt-0">
            <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {children}
        </section>
    );
}

/**
 * The form for a booking the owner took by phone, chat or in person. It's
 * confirmed straight away; on success the server opens the new booking.
 * Used in the add-booking modal and on its own page.
 */
export function ManualBookingForm({
    options: { cars, sources, paymentMethods, hasStorefront, seasons },
    initialCar = null,
    onCancel,
    onSuccess,
}: {
    options: ManualBookingOptions;
    initialCar?: string | null;
    onCancel: () => void;
    onSuccess?: () => void;
}) {
    const [range, setRange] = useState<DateRange | undefined>();
    const { workspace } = usePage<{
        workspace?: { permissions: string[] } | null;
    }>().props;
    // Recording a payment is for the owner and staff who handle payments.
    const canRecordPayment =
        !workspace || workspace.permissions.includes('payments');
    const form = useForm<{
        car: string;
        start_date: string;
        end_date: string;
        renter_name: string;
        renter_phone: string;
        renter_email: string;
        renter_license_number: string;
        license_photo: File | null;
        source: string;
        payment_method: string;
        is_paid: boolean;
        with_delivery: boolean;
        delivery_address: string;
        with_driver: boolean;
        notes: string;
    }>({
        car:
            cars.find((car) => car.slug === initialCar)?.slug ??
            (cars.length === 1 ? cars[0].slug : ''),
        start_date: '',
        end_date: '',
        renter_name: '',
        renter_phone: '',
        renter_email: '',
        renter_license_number: '',
        license_photo: null,
        source: sources[0]?.value ?? 'phone',
        payment_method: paymentMethods[0]?.value ?? 'pickup',
        is_paid: false,
        with_delivery: false,
        delivery_address: '',
        with_driver: false,
        notes: '',
    });
    const car = cars.find((option) => option.slug === form.data.car);
    const quote = car
        ? calculateBookingQuote(car, range, {
              withDelivery: form.data.with_delivery,
              withDriver: form.data.with_driver,
              seasons,
          })
        : null;

    function chooseCar(slug: string | null): void {
        setRange(undefined);
        form.setData((data) => ({
            ...data,
            car: slug ?? '',
            start_date: '',
            end_date: '',
            with_delivery: false,
            with_driver: false,
        }));
    }

    function chooseDates(next: DateRange | undefined): void {
        setRange(next);
        form.setData((data) => ({
            ...data,
            start_date: next?.from ? toIsoDate(next.from) : '',
            end_date: next?.to ? toIsoDate(next.to) : '',
        }));
    }

    function submit(event: FormEvent): void {
        event.preventDefault();
        form.post(lessor.bookings.store().url, {
            preserveScroll: true,
            onSuccess,
        });
    }

    if (!hasStorefront || cars.length === 0) {
        return (
            <EmptyState
                icon={Store}
                title={
                    hasStorefront
                        ? 'Add a car first'
                        : 'Set up your booking page first'
                }
                description="You need a booking page and at least one car to add bookings."
                action={
                    <BrandButton className="rounded-full" asChild>
                        <Link
                            href={
                                hasStorefront
                                    ? lessor.cars.create()
                                    : lessor.storefront.edit()
                            }
                        >
                            {hasStorefront
                                ? 'Add a car'
                                : 'Set up booking page'}
                        </Link>
                    </BrandButton>
                }
            />
        );
    }

    return (
        <form onSubmit={submit} className="space-y-5">
            <Section
                title="Car and dates"
                description="Days already booked or blocked are greyed out."
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField id="car" label="Car" error={form.errors.car}>
                        <OptionSelect
                            id="car"
                            options={cars.map((option) => ({
                                value: option.slug,
                                label: option.name,
                            }))}
                            value={form.data.car || null}
                            onChange={chooseCar}
                            placeholder="Choose a car"
                        />
                    </FormField>
                    <FormField
                        id="dates"
                        label="Pickup and return"
                        error={form.errors.start_date ?? form.errors.end_date}
                    >
                        <div
                            className={cn(
                                !car && 'pointer-events-none opacity-50',
                            )}
                        >
                            <DateRangePicker
                                id="dates"
                                key={form.data.car}
                                value={range}
                                onChange={chooseDates}
                                bookedRanges={car?.booked_ranges ?? []}
                            />
                        </div>
                    </FormField>
                </div>
                {car &&
                    (car.delivery_fee !== null ||
                        car.driver_daily_rate !== null) && (
                        <div className="mt-4 space-y-2">
                            {car.driver_daily_rate !== null && (
                                <label className="flex cursor-pointer items-center gap-3 text-sm">
                                    <Checkbox
                                        checked={form.data.with_driver}
                                        onCheckedChange={(checked) =>
                                            form.setData(
                                                'with_driver',
                                                checked === true,
                                            )
                                        }
                                    />
                                    With a driver (
                                    {formatPeso(car.driver_daily_rate)}
                                    /day)
                                </label>
                            )}
                            {car.delivery_fee !== null && (
                                <label className="flex cursor-pointer items-center gap-3 text-sm">
                                    <Checkbox
                                        checked={form.data.with_delivery}
                                        onCheckedChange={(checked) =>
                                            form.setData(
                                                'with_delivery',
                                                checked === true,
                                            )
                                        }
                                    />
                                    Deliver the car (
                                    {car.delivery_fee === 0
                                        ? 'free'
                                        : formatPeso(car.delivery_fee)}
                                    )
                                </label>
                            )}
                            {form.data.with_delivery && (
                                <div>
                                    <Input
                                        aria-label="Delivery address"
                                        value={form.data.delivery_address}
                                        onChange={(event) =>
                                            form.setData(
                                                'delivery_address',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Hotel, street address or landmark"
                                    />
                                    <InputError
                                        message={form.errors.delivery_address}
                                        className="mt-1"
                                    />
                                </div>
                            )}
                        </div>
                    )}
            </Section>

            <Section
                title="Renter"
                description="Their license number and a photo of it are required. Add an email to send them the booking."
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        id="renter_name"
                        label="Full name"
                        error={form.errors.renter_name}
                    >
                        <Input
                            id="renter_name"
                            value={form.data.renter_name}
                            onChange={(event) =>
                                form.setData('renter_name', event.target.value)
                            }
                            required
                        />
                    </FormField>
                    <FormField
                        id="renter_phone"
                        label="Mobile number"
                        error={form.errors.renter_phone}
                    >
                        <Input
                            id="renter_phone"
                            inputMode="tel"
                            value={form.data.renter_phone}
                            onChange={(event) =>
                                form.setData('renter_phone', event.target.value)
                            }
                            placeholder="09171234567"
                            required
                        />
                    </FormField>
                    <FormField
                        id="renter_email"
                        label="Email (optional)"
                        error={form.errors.renter_email}
                    >
                        <Input
                            id="renter_email"
                            type="email"
                            value={form.data.renter_email}
                            onChange={(event) =>
                                form.setData('renter_email', event.target.value)
                            }
                        />
                    </FormField>
                    <FormField
                        id="renter_license_number"
                        label="License number"
                        error={form.errors.renter_license_number}
                    >
                        <Input
                            id="renter_license_number"
                            required
                            value={form.data.renter_license_number}
                            onChange={(event) =>
                                form.setData(
                                    'renter_license_number',
                                    event.target.value,
                                )
                            }
                        />
                    </FormField>
                    <FormField
                        id="license_photo"
                        label="License photo"
                        error={form.errors.license_photo}
                    >
                        <FilePicker
                            id="license_photo"
                            required
                            placeholder="Take or choose a photo"
                            onFiles={(files) =>
                                form.setData('license_photo', files[0] ?? null)
                            }
                        />
                    </FormField>
                    <FormField
                        id="source"
                        label="How they booked"
                        className="sm:col-span-2"
                        error={form.errors.source}
                    >
                        <Choice
                            id="source"
                            options={sources}
                            value={form.data.source}
                            onChange={(value) => form.setData('source', value)}
                        />
                    </FormField>
                </div>
            </Section>

            <Section
                title="Payment"
                description="How they're paying, and whether you've been paid already."
            >
                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-4">
                        <FormField
                            id="payment_method"
                            label="Payment method"
                            error={form.errors.payment_method}
                        >
                            <Choice
                                id="payment_method"
                                options={paymentMethods}
                                value={form.data.payment_method}
                                onChange={(value) =>
                                    form.setData('payment_method', value)
                                }
                            />
                        </FormField>
                        {canRecordPayment && (
                            <label className="flex cursor-pointer items-center gap-3 text-sm">
                                <Checkbox
                                    checked={form.data.is_paid}
                                    onCheckedChange={(checked) =>
                                        form.setData(
                                            'is_paid',
                                            checked === true,
                                        )
                                    }
                                />
                                Already paid
                            </label>
                        )}
                        <FormField
                            id="notes"
                            label="Note (optional)"
                            error={form.errors.notes}
                        >
                            <Textarea
                                id="notes"
                                rows={3}
                                value={form.data.notes}
                                onChange={(event) =>
                                    form.setData('notes', event.target.value)
                                }
                                placeholder="Pickup time, special requests…"
                            />
                        </FormField>
                    </div>
                    {quote ? (
                        <BookingSummary quote={quote} />
                    ) : (
                        <p className="flex items-center justify-center rounded-2xl bg-muted/40 p-4 text-center text-sm text-muted-foreground">
                            Pick a car and dates to see the price.
                        </p>
                    )}
                </div>
            </Section>

            <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:items-center sm:justify-end">
                <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
                <BrandButton
                    type="submit"
                    className="rounded-full px-6"
                    disabled={form.processing}
                >
                    {form.processing && <Spinner />}
                    Add booking
                </BrandButton>
            </div>
        </form>
    );
}
