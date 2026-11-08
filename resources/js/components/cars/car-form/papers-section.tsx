import { differenceInCalendarDays, parseISO } from 'date-fns';
import { FormField } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import type { Car } from '@/types';
import type { FormErrors } from './types';

/** "Expires in 12 days" or "Expired", for a date close enough to matter. */
function expiryHint(date: string | null | undefined): string | undefined {
    if (!date) {
        return 'We remind you 30 and 7 days before.';
    }

    const daysLeft = differenceInCalendarDays(parseISO(date), new Date());

    if (daysLeft < 0) {
        return 'Expired. Renew it soon.';
    }

    return daysLeft <= 30
        ? `Expires in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}.`
        : 'We remind you 30 and 7 days before.';
}

/**
 * Plate number and the paperwork dates Rentiva reminds the owner about.
 * Only the owner sees these; the plate prints on the rental agreement.
 */
export function PapersSection({
    car,
    errors,
}: {
    car?: Car;
    errors: FormErrors;
}) {
    return (
        <div className="grid gap-5 sm:grid-cols-3">
            <FormField
                id="plate_number"
                label="Plate number"
                error={errors.plate_number}
                hint="Printed on the rental agreement."
            >
                <Input
                    id="plate_number"
                    name="plate_number"
                    defaultValue={car?.plate_number ?? ''}
                    placeholder="ABC 1234"
                    maxLength={15}
                    className="uppercase"
                />
            </FormField>
            <FormField
                id="registration_expires_on"
                label="Registration expires"
                error={errors.registration_expires_on}
                hint={expiryHint(car?.registration_expires_on)}
            >
                <Input
                    id="registration_expires_on"
                    name="registration_expires_on"
                    type="date"
                    defaultValue={car?.registration_expires_on ?? ''}
                />
            </FormField>
            <FormField
                id="insurance_expires_on"
                label="Insurance expires"
                error={errors.insurance_expires_on}
                hint={expiryHint(car?.insurance_expires_on)}
            >
                <Input
                    id="insurance_expires_on"
                    name="insurance_expires_on"
                    type="date"
                    defaultValue={car?.insurance_expires_on ?? ''}
                />
            </FormField>
        </div>
    );
}
