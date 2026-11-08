import { Head, Link, useForm } from '@inertiajs/react';
import { Store } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { BookingSummary } from '@/components/bookings/booking-summary';
import { DateRangePicker } from '@/components/date-range-picker';
import { EmptyState } from '@/components/empty-state';
import { FormField } from '@/components/form-field';
import { FormSaveBar } from '@/components/form-save-bar';
import InputError from '@/components/input-error';
import { FormSection } from '@/components/lessor/form-section';
import { PageHeader } from '@/components/lessor/page-header';
import { OptionSelect } from '@/components/option-select';
import { BrandButton } from '@/components/public/brand-button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Season } from '@/lib/booking-quote';
import { calculateBookingQuote } from '@/lib/booking-quote';
import { formatPeso, toIsoDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';
import type { BookedRange, Car, Option } from '@/types';

type BookableCar = Pick<
    Car,
    | 'slug'
    | 'name'
    | 'daily_rate'
    | 'security_deposit'
    | 'weekly_discount'
    | 'monthly_discount'
    | 'delivery_fee'
    | 'driver_daily_rate'
> & { booked_ranges: BookedRange[] };

/** Segmented choice between a few options. */
function Choice({
    options,
    value,
    onChange,
}: {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    aria-pressed={value === option.value}
                    onClick={() => onChange(option.value)}
                    className={cn(
                        'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                        value === option.value
                            ? 'border-brand bg-brand/10 font-medium text-brand'
                            : 'text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

export default function LessorBookingCreate({
    cars,
    initialCar,
    sources,
    paymentMethods,
    hasStorefront,
    seasons,
}: {
    seasons: Season[];
    cars: BookableCar[];
    initialCar: string | null;
    sources: Option[];
    paymentMethods: Option[];
    hasStorefront: boolean;
}) {
    const [range, setRange] = useState<DateRange | undefined>();
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
        form.post(lessor.bookings.store().url, { preserveScroll: true });
    }

    if (!hasStorefront || cars.length === 0) {
        return (
            <>
                <Head title="Add a booking" />
                <div className="mx-auto w-full max-w-4xl p-4 md:p-8">
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
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Add a booking" />

            <form
                onSubmit={submit}
                className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-8"
            >
                <PageHeader
                    eyebrow="Requests and trips"
                    title="Add a booking"
                    description="For bookings you took by phone, chat or in person. It's confirmed straight away and the dates are taken off your booking page."
                />

                <FormSection
                    step={1}
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
                            error={
                                form.errors.start_date ?? form.errors.end_date
                            }
                        >
                            <div
                                className={cn(
                                    !car && 'pointer-events-none opacity-50',
                                )}
                            >
                                <DateRangePicker
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
                                            message={
                                                form.errors.delivery_address
                                            }
                                            className="mt-1"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                </FormSection>

                <FormSection
                    step={2}
                    title="Renter"
                    description="Name and mobile number are enough. Add an email to send them the booking."
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
                                    form.setData(
                                        'renter_name',
                                        event.target.value,
                                    )
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
                                    form.setData(
                                        'renter_phone',
                                        event.target.value,
                                    )
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
                                    form.setData(
                                        'renter_email',
                                        event.target.value,
                                    )
                                }
                            />
                        </FormField>
                        <FormField
                            id="renter_license_number"
                            label="License number (optional)"
                            error={form.errors.renter_license_number}
                        >
                            <Input
                                id="renter_license_number"
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
                            label="License photo (optional)"
                            error={form.errors.license_photo}
                        >
                            <Input
                                id="license_photo"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(event) =>
                                    form.setData(
                                        'license_photo',
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                            />
                        </FormField>
                        <FormField
                            id="source"
                            label="How they booked"
                            error={form.errors.source}
                        >
                            <Choice
                                options={sources}
                                value={form.data.source}
                                onChange={(value) =>
                                    form.setData('source', value)
                                }
                            />
                        </FormField>
                    </div>
                </FormSection>

                <FormSection
                    step={3}
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
                                    options={paymentMethods}
                                    value={form.data.payment_method}
                                    onChange={(value) =>
                                        form.setData('payment_method', value)
                                    }
                                />
                            </FormField>
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
                                        form.setData(
                                            'notes',
                                            event.target.value,
                                        )
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
                </FormSection>

                <FormSaveBar
                    label="Add booking"
                    hint="Confirmed straight away."
                    processing={form.processing}
                    progress={form.progress?.percentage}
                    cancelHref={lessor.bookings.calendar()}
                />
            </form>
        </>
    );
}

LessorBookingCreate.layout = {
    breadcrumbs: [
        { title: 'Bookings', href: lessor.bookings.calendar() },
        { title: 'Add a booking', href: lessor.bookings.create() },
    ],
};
