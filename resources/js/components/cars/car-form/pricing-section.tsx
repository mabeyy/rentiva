import { FormField } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import type { Car } from '@/types';
import type { FormErrors } from './types';

/** Centavos to a peso value for an input; blank when not set. */
function pesos(centavos: number | null | undefined): number | string {
    return centavos === null || centavos === undefined ? '' : centavos / 100;
}

/** A number input with a short unit inside it, e.g. "₱" or "%". */
function AmountInput({
    id,
    defaultValue,
    unit,
    placeholder,
    min = 0,
    max,
    step = 50,
    required,
}: {
    id: string;
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
                name={id}
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
 * The rate renters pay, plus the optional deposit, discounts and extras.
 */
export function PricingSection({
    car,
    errors,
}: {
    car?: Car;
    errors: FormErrors;
}) {
    return (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
                id="daily_rate"
                label="Daily rate"
                error={errors.daily_rate}
            >
                <AmountInput
                    id="daily_rate"
                    unit="₱"
                    min={300}
                    defaultValue={pesos(car?.daily_rate)}
                    placeholder="2500"
                    required
                />
            </FormField>
            <FormField
                id="security_deposit"
                label="Security deposit"
                error={errors.security_deposit}
                hint="Collected at pickup, returned with the car."
            >
                <AmountInput
                    id="security_deposit"
                    unit="₱"
                    defaultValue={pesos(car?.security_deposit || null)}
                    placeholder="None"
                />
            </FormField>
            <div className="hidden lg:block" />
            <FormField
                id="weekly_discount"
                label="7+ day discount"
                error={errors.weekly_discount}
            >
                <AmountInput
                    id="weekly_discount"
                    unit="%"
                    max={50}
                    step={1}
                    defaultValue={car?.weekly_discount || ''}
                    placeholder="0"
                />
            </FormField>
            <FormField
                id="monthly_discount"
                label="28+ day discount"
                error={errors.monthly_discount}
                hint="Replaces the 7-day discount."
            >
                <AmountInput
                    id="monthly_discount"
                    unit="%"
                    max={70}
                    step={1}
                    defaultValue={car?.monthly_discount || ''}
                    placeholder="0"
                />
            </FormField>
            <div className="hidden lg:block" />
            <FormField
                id="delivery_fee"
                label="Delivery fee"
                error={errors.delivery_fee}
                hint="Leave blank if you don't deliver. 0 for free delivery."
            >
                <AmountInput
                    id="delivery_fee"
                    unit="₱"
                    defaultValue={pesos(car?.delivery_fee)}
                    placeholder="Not offered"
                />
            </FormField>
            <FormField
                id="driver_daily_rate"
                label="Driver, per day"
                error={errors.driver_daily_rate}
                hint="Leave blank if you don't offer a driver."
            >
                <AmountInput
                    id="driver_daily_rate"
                    unit="₱"
                    defaultValue={pesos(car?.driver_daily_rate)}
                    placeholder="Not offered"
                />
            </FormField>
        </div>
    );
}
