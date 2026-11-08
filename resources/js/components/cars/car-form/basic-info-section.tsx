import { Link } from '@inertiajs/react';
import { FormField } from '@/components/form-field';
import { OptionSelect } from '@/components/option-select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import lessor from '@/routes/lessor';
import type { Car, Option, PickupLocation } from '@/types';
import type { FormErrors } from './types';

export function BasicInfoSection({
    car,
    bodyTypes,
    errors,
    onBodyTypeChange,
    pickupLocations,
    mainPickupLocationId,
}: {
    car?: Car;
    bodyTypes: Option[];
    errors: FormErrors;
    onBodyTypeChange: (bodyType: string | null) => void;
    pickupLocations: PickupLocation[];
    mainPickupLocationId: number | null;
}) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="make" label="Make" error={errors.make}>
                <Input
                    id="make"
                    name="make"
                    defaultValue={car?.make}
                    required
                    placeholder="Toyota"
                />
            </FormField>
            <FormField id="model" label="Model" error={errors.model}>
                <Input
                    id="model"
                    name="model"
                    defaultValue={car?.model}
                    required
                    placeholder="Vios"
                />
            </FormField>
            <FormField id="year" label="Model year" error={errors.year}>
                <Input
                    id="year"
                    name="year"
                    type="number"
                    defaultValue={car?.year}
                    required
                    min={1990}
                />
            </FormField>
            <FormField
                id="body_type"
                label="Vehicle type"
                error={errors.body_type}
            >
                <OptionSelect
                    id="body_type"
                    name="body_type"
                    options={bodyTypes}
                    defaultValue={car?.body_type.value}
                    onChange={onBodyTypeChange}
                />
            </FormField>
            <FormField
                id="exterior_color"
                label="Exterior color"
                error={errors.exterior_color}
            >
                <Input
                    id="exterior_color"
                    name="exterior_color"
                    defaultValue={car?.exterior_color}
                    required
                    placeholder="Pearl white"
                />
            </FormField>
            <FormField
                id="pickup_location_id"
                label="Pickup location"
                error={errors.pickup_location_id}
            >
                {pickupLocations.length > 0 ? (
                    <OptionSelect
                        id="pickup_location_id"
                        name="pickup_location_id"
                        options={pickupLocations.map((location) => ({
                            value: String(location.id),
                            label: `${location.address}, ${location.city}`,
                        }))}
                        defaultValue={String(
                            car?.pickup_location?.id ??
                                mainPickupLocationId ??
                                pickupLocations[0].id,
                        )}
                        placeholder="Choose a pickup location"
                    />
                ) : (
                    <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                        Add where renters pick up your cars first.{' '}
                        <Link
                            href={lessor.pickupLocations.index()}
                            className="font-medium text-foreground underline underline-offset-4"
                        >
                            Add a pickup location
                        </Link>
                    </p>
                )}
            </FormField>
            <FormField
                id="description"
                label="Description"
                error={errors.description}
                className="sm:col-span-2"
            >
                <Textarea
                    id="description"
                    name="description"
                    rows={4}
                    defaultValue={car?.description ?? ''}
                    placeholder="Condition, pickup instructions, house rules…"
                />
            </FormField>
        </div>
    );
}
