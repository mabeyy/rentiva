import { FormField } from '@/components/form-field';
import { OptionSelect } from '@/components/option-select';
import { Input } from '@/components/ui/input';
import type { Car, CarSpecOptions } from '@/types';
import type { FormErrors } from './types';

/**
 * Capacity and running specs. Two-wheelers skip drivetrain and doors, count
 * riders instead of seats and helmets instead of bags.
 */
export function SpecsSection({
    car,
    options,
    errors,
    isTwoWheeler,
}: {
    car?: Car;
    options: Omit<CarSpecOptions, 'bodyTypes'>;
    errors: FormErrors;
    isTwoWheeler: boolean;
}) {
    return (
        <div className="grid gap-4 sm:grid-cols-3">
            <FormField
                id="transmission"
                label="Transmission"
                error={errors.transmission}
            >
                <OptionSelect
                    id="transmission"
                    name="transmission"
                    options={options.transmissions}
                    defaultValue={car?.transmission.value}
                />
            </FormField>
            <FormField id="fuel_type" label="Fuel" error={errors.fuel_type}>
                <OptionSelect
                    id="fuel_type"
                    name="fuel_type"
                    options={options.fuelTypes}
                    defaultValue={car?.fuel_type.value}
                />
            </FormField>
            {!isTwoWheeler && (
                <FormField
                    id="drivetrain"
                    label="Drivetrain"
                    error={errors.drivetrain}
                >
                    <OptionSelect
                        id="drivetrain"
                        name="drivetrain"
                        options={options.drivetrains}
                        defaultValue={car?.drivetrain?.value}
                    />
                </FormField>
            )}
            <FormField
                id="seats"
                label={isTwoWheeler ? 'Riders' : 'Seats'}
                error={errors.seats}
            >
                <Input
                    key={isTwoWheeler ? 'riders' : 'seats'}
                    id="seats"
                    name="seats"
                    type="number"
                    min={isTwoWheeler ? 1 : 2}
                    max={isTwoWheeler ? 2 : 15}
                    defaultValue={car?.seats ?? (isTwoWheeler ? 2 : 5)}
                    required
                />
            </FormField>
            {!isTwoWheeler && (
                <FormField id="doors" label="Doors" error={errors.doors}>
                    <Input
                        id="doors"
                        name="doors"
                        type="number"
                        min={2}
                        max={5}
                        defaultValue={car?.doors ?? 4}
                        required
                    />
                </FormField>
            )}
            <FormField
                id="luggage_capacity"
                label={
                    isTwoWheeler
                        ? 'Under-seat storage (helmets)'
                        : 'Luggage (bags)'
                }
                error={errors.luggage_capacity}
            >
                <Input
                    key={isTwoWheeler ? 'helmets' : 'bags'}
                    id="luggage_capacity"
                    name="luggage_capacity"
                    type="number"
                    min={0}
                    max={10}
                    defaultValue={
                        car?.luggage_capacity ?? (isTwoWheeler ? 1 : 2)
                    }
                    required
                />
            </FormField>
            <FormField
                id="fuel_economy_city"
                label="Fuel economy, city (km/L)"
                error={errors.fuel_economy_city}
            >
                <Input
                    id="fuel_economy_city"
                    name="fuel_economy_city"
                    type="number"
                    step="0.1"
                    min={1}
                    defaultValue={car?.fuel_economy_city ?? undefined}
                />
            </FormField>
            <FormField
                id="fuel_economy_highway"
                label="Fuel economy, highway (km/L)"
                error={errors.fuel_economy_highway}
            >
                <Input
                    id="fuel_economy_highway"
                    name="fuel_economy_highway"
                    type="number"
                    step="0.1"
                    min={1}
                    defaultValue={car?.fuel_economy_highway ?? undefined}
                />
            </FormField>
        </div>
    );
}
