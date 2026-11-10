import { FormField } from '@/components/form-field';
import { Input } from '@/components/ui/input';

/** Discounts, extras and deposit, with peso amounts in centavos. */
export type Extras = {
    weekly_discount: number;
    monthly_discount: number;
    delivery_fee: number | null;
    driver_daily_rate: number | null;
    deposit_percent: number;
};

/** Centavos to a peso value for an input; blank when not set. */
export function pesos(centavos: number | null | undefined): number | string {
    return centavos === null || centavos === undefined ? '' : centavos / 100;
}

/** A number input with a short unit inside it, e.g. "₱" or "%". */
export function AmountInput({
    id,
    name = id,
    defaultValue,
    unit,
    placeholder,
    min = 0,
    max,
    step = 50,
    required,
}: {
    id: string;
    name?: string;
    defaultValue: number | string;
    unit: string;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    required?: boolean;
}) {
    const isPrefix = unit === '₱';

    return (
        <div className="relative">
            <span
                className={
                    isPrefix
                        ? 'pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground'
                        : 'pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground'
                }
            >
                {unit}
            </span>
            <Input
                id={id}
                name={name}
                type="number"
                inputMode="decimal"
                min={min}
                max={max}
                step={step}
                defaultValue={defaultValue}
                placeholder={placeholder}
                required={required}
                className={isPrefix ? 'pl-7 tabular-nums' : 'pr-8 tabular-nums'}
            />
        </div>
    );
}

/**
 * The long-stay discounts, deposit, delivery fee and driver rate. Policies
 * uses them as the business defaults (`prefix="default_"`); a car uses them
 * when it has its own.
 */
export function ExtrasFields({
    values,
    errors,
    prefix = '',
}: {
    values: Extras;
    errors: Partial<Record<string, string>>;
    prefix?: string;
}) {
    const field = (name: keyof Extras) => `${prefix}${name}`;

    return (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
                id={field('weekly_discount')}
                label="7+ day discount"
                error={errors[field('weekly_discount')]}
                hint="Off rentals of a week or more."
            >
                <AmountInput
                    id={field('weekly_discount')}
                    unit="%"
                    max={50}
                    step={1}
                    defaultValue={values.weekly_discount}
                />
            </FormField>
            <FormField
                id={field('monthly_discount')}
                label="28+ day discount"
                error={errors[field('monthly_discount')]}
                hint="Replaces the 7-day discount."
            >
                <AmountInput
                    id={field('monthly_discount')}
                    unit="%"
                    max={70}
                    step={1}
                    defaultValue={values.monthly_discount}
                />
            </FormField>
            <FormField
                id={field('deposit_percent')}
                label="Security deposit"
                error={errors[field('deposit_percent')]}
                hint="Of the rental, collected at pickup and returned with the car. 0 for none."
                info="Worked out from the days rented, after any discount and before delivery or driver fees, rounded to the peso. On a ₱9,000 rental, 20% is a ₱1,800 deposit."
            >
                <AmountInput
                    id={field('deposit_percent')}
                    unit="%"
                    max={100}
                    step={5}
                    defaultValue={values.deposit_percent}
                />
            </FormField>
            <FormField
                id={field('delivery_fee')}
                label="Delivery fee"
                error={errors[field('delivery_fee')]}
                hint="Leave blank if you don't deliver. 0 for free delivery."
            >
                <AmountInput
                    id={field('delivery_fee')}
                    unit="₱"
                    defaultValue={pesos(values.delivery_fee)}
                    placeholder="Not offered"
                />
            </FormField>
            <FormField
                id={field('driver_daily_rate')}
                label="Driver, per day"
                error={errors[field('driver_daily_rate')]}
                hint="Leave blank if you don't offer a driver."
            >
                <AmountInput
                    id={field('driver_daily_rate')}
                    unit="₱"
                    defaultValue={pesos(values.driver_daily_rate)}
                    placeholder="Not offered"
                />
            </FormField>
        </div>
    );
}

/** e.g. "10% off 7+ days · 20% off 28+ days · 20% deposit · Delivery ₱500 · No driver". */
export function describeExtras(extras: Extras): string[] {
    const peso = (centavos: number) =>
        `₱${(centavos / 100).toLocaleString('en-PH')}`;

    return [
        extras.weekly_discount
            ? `${extras.weekly_discount}% off 7+ days`
            : 'No 7-day discount',
        extras.monthly_discount
            ? `${extras.monthly_discount}% off 28+ days`
            : 'No 28-day discount',
        extras.deposit_percent
            ? `${extras.deposit_percent}% deposit`
            : 'No deposit',
        extras.delivery_fee === null
            ? 'No delivery'
            : extras.delivery_fee === 0
              ? 'Free delivery'
              : `Delivery ${peso(extras.delivery_fee)}`,
        extras.driver_daily_rate === null
            ? 'No driver'
            : `Driver ${peso(extras.driver_daily_rate)}/day`,
    ];
}
