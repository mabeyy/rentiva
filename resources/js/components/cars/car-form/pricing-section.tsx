import { Link } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import type { Extras } from '@/components/lessor/extras-fields';
import {
    AmountInput,
    ExtrasFields,
    describeExtras,
    pesos,
} from '@/components/lessor/extras-fields';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import lessor from '@/routes/lessor';
import type { Car } from '@/types';
import type { FormErrors } from './types';

/**
 * The car's daily rate, and its discounts, extras and deposit: the business
 * defaults from Policies, or the car's own when switched on.
 */
export function PricingSection({
    car,
    defaults,
    errors,
}: {
    car?: Car;
    /** The business-wide values from Policies. */
    defaults: Extras;
    errors: FormErrors;
}) {
    const [hasOwnExtras, setHasOwnExtras] = useState(
        car?.custom_extras ?? false,
    );
    const ownValues: Extras =
        car && car.custom_extras
            ? {
                  weekly_discount: car.weekly_discount,
                  monthly_discount: car.monthly_discount,
                  delivery_fee: car.delivery_fee,
                  driver_daily_rate: car.driver_daily_rate,
                  deposit_percent: car.deposit_percent,
              }
            : defaults;

    return (
        <div className="space-y-5">
            <div className="grid gap-2">
                <Label htmlFor="daily_rate">Daily rate</Label>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="w-48">
                        <AmountInput
                            id="daily_rate"
                            unit="₱"
                            min={300}
                            defaultValue={pesos(car?.daily_rate)}
                            placeholder="2500"
                            required
                        />
                    </div>
                </div>
                <InputError message={errors.daily_rate} />
            </div>

            <div className="rounded-2xl border p-4">
                <label className="flex cursor-pointer items-start justify-between gap-4">
                    <span>
                        <span className="block text-sm font-medium">
                            Use different discounts, deposit and extras for this
                            car
                        </span>
                        <span className="block text-sm text-muted-foreground">
                            {hasOwnExtras
                                ? 'On: this car uses its own values below instead of your business defaults in'
                                : 'Off: this car follows your business defaults, set once in'}{' '}
                            <Link
                                href={lessor.policies.edit()}
                                className="font-medium text-foreground underline underline-offset-2"
                            >
                                Policies
                            </Link>
                            .
                        </span>
                    </span>
                    <Switch
                        name="custom_extras"
                        value="1"
                        checked={hasOwnExtras}
                        onCheckedChange={setHasOwnExtras}
                        aria-label="Use different discounts, deposit and extras for this car"
                    />
                </label>

                <div className="mt-4 border-t pt-4">
                    {hasOwnExtras ? (
                        <ExtrasFields values={ownValues} errors={errors} />
                    ) : (
                        <ul className="flex flex-wrap gap-2">
                            {describeExtras(defaults).map((line) => (
                                <li
                                    key={line}
                                    className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-sm"
                                >
                                    <Check className="size-3.5 text-brand" />
                                    {line}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
