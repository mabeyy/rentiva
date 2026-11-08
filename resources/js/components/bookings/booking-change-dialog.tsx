import { useForm } from '@inertiajs/react';
import { parseISO } from 'date-fns';
import { CalendarClock } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { BookingSummary } from '@/components/bookings/booking-summary';
import { DateRangePicker } from '@/components/date-range-picker';
import { FormField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { OptionSelect } from '@/components/option-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type { Season } from '@/lib/booking-quote';
import { calculateBookingQuote } from '@/lib/booking-quote';
import { formatPeso, toIsoDate } from '@/lib/format';
import lessor from '@/routes/lessor';
import type { BookedRange, Booking, Car } from '@/types';

export type ChangeableCar = Pick<
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

/**
 * Move, extend or shorten a booking, or switch its car. Shows the new price
 * (before extra charges, which are kept) and emails the renter.
 */
export function BookingChangeDialog({
    booking,
    cars,
    seasons,
}: {
    booking: Booking;
    cars: ChangeableCar[];
    seasons: Season[];
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [range, setRange] = useState<DateRange | undefined>({
        from: parseISO(booking.start_date),
        to: parseISO(booking.end_date),
    });
    const form = useForm({
        car: booking.car?.slug ?? '',
        start_date: booking.start_date,
        end_date: booking.end_date,
        with_delivery: booking.delivery_address !== null,
        delivery_address: booking.delivery_address ?? '',
        with_driver: booking.with_driver,
        ignore_rules: false,
    });
    const car = cars.find((option) => option.slug === form.data.car);
    const quote = car
        ? calculateBookingQuote(car, range, {
              withDelivery: form.data.with_delivery,
              withDriver: form.data.with_driver,
              seasons,
          })
        : null;

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
        form.put(lessor.bookings.trip.update(booking.reference).url, {
            preserveScroll: true,
            onSuccess: () => setIsOpen(false),
        });
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full">
                    <CalendarClock /> Change
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <form onSubmit={submit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>Change {booking.reference}</DialogTitle>
                        <DialogDescription>
                            Extend, move or shorten the rental, or switch the
                            car. Extra charges stay on the bill.
                        </DialogDescription>
                    </DialogHeader>

                    <FormField
                        id="change_car"
                        label="Car"
                        error={form.errors.car}
                    >
                        <OptionSelect
                            id="change_car"
                            options={cars.map((option) => ({
                                value: option.slug,
                                label: option.name,
                            }))}
                            value={form.data.car}
                            onChange={(slug) => {
                                form.setData('car', slug ?? '');
                            }}
                        />
                    </FormField>
                    <FormField
                        id="change_dates"
                        label="Pickup and return"
                        error={form.errors.start_date ?? form.errors.end_date}
                    >
                        <DateRangePicker
                            key={form.data.car}
                            value={range}
                            onChange={chooseDates}
                            bookedRanges={car?.booked_ranges ?? []}
                        />
                    </FormField>

                    {car?.driver_daily_rate !== null &&
                        car?.driver_daily_rate !== undefined && (
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
                                {formatPeso(car.driver_daily_rate)}/day)
                            </label>
                        )}
                    {car?.delivery_fee !== null &&
                        car?.delivery_fee !== undefined && (
                            <div className="space-y-2">
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

                    {form.errors.ignore_rules && (
                        <div className="space-y-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                            <p>{form.errors.ignore_rules}</p>
                            <label className="flex cursor-pointer items-center gap-2 font-medium">
                                <Checkbox
                                    checked={form.data.ignore_rules}
                                    onCheckedChange={(checked) =>
                                        form.setData(
                                            'ignore_rules',
                                            checked === true,
                                        )
                                    }
                                />
                                Allow anyway
                            </label>
                        </div>
                    )}

                    {quote && (
                        <div className="space-y-1">
                            <BookingSummary
                                quote={quote}
                                totalLabel="New total"
                            />
                            {booking.charges_total > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Plus {formatPeso(booking.charges_total)} in
                                    extra charges already added.
                                </p>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={form.processing || !quote}
                        >
                            {form.processing && <Spinner />}
                            Save changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
