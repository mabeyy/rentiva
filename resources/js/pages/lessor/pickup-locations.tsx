import { Form, Head, router } from '@inertiajs/react';
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import MainPickupLocationController from '@/actions/App/Http/Controllers/Lessor/MainPickupLocationController';
import PickupLocationController from '@/actions/App/Http/Controllers/Lessor/PickupLocationController';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { FormField } from '@/components/form-field';
import { PageHeader } from '@/components/lessor/page-header';
import { UpgradeNote } from '@/components/lessor/upgrade-note';
import { usePlanFeature } from '@/hooks/use-plan-feature';
import { BrandButton } from '@/components/public/brand-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import lessor from '@/routes/lessor';
import type { PickupLocation } from '@/types';
import type { RouteFormDefinition } from '@/wayfinder';

/**
 * Street address and city fields, used to add or edit a location.
 */
function LocationForm({
    form,
    location,
    submitLabel,
    onDone,
}: {
    form: RouteFormDefinition<'post' | 'put' | 'patch'>;
    location?: PickupLocation;
    submitLabel: string;
    onDone?: () => void;
}) {
    const idPrefix = location ? `location-${location.id}` : 'new-location';

    return (
        <Form
            {...form}
            options={{ preserveScroll: true }}
            resetOnSuccess={!location}
            onSuccess={onDone}
            className="space-y-4"
        >
            {({ processing, errors }) => (
                <>
                    <FormField
                        id={`${idPrefix}-address`}
                        label="Street address"
                        error={errors.address}
                    >
                        <Input
                            id={`${idPrefix}-address`}
                            name="address"
                            required
                            defaultValue={location?.address}
                            placeholder="123 Corrales Ave, Barangay 30"
                            autoComplete="street-address"
                        />
                    </FormField>
                    <FormField
                        id={`${idPrefix}-city`}
                        label="City"
                        error={errors.city}
                    >
                        <Input
                            id={`${idPrefix}-city`}
                            name="city"
                            required
                            defaultValue={location?.city}
                            placeholder="Cebu City"
                        />
                    </FormField>
                    <p className="text-sm text-muted-foreground">
                        Shown to renters so they know exactly where to go.
                    </p>
                    <div className="flex gap-2">
                        <BrandButton
                            type="submit"
                            className="rounded-full px-5"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            {submitLabel}
                        </BrandButton>
                        {onDone && location && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="rounded-full"
                                onClick={onDone}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </>
            )}
        </Form>
    );
}

function LocationCard({
    location,
    isMain,
    canBecomeMain,
}: {
    location: PickupLocation;
    isMain: boolean;
    /** False until the owner has a booking page to set a main location on. */
    canBecomeMain: boolean;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const carsCount = location.cars_count ?? 0;

    if (isEditing) {
        return (
            <li className="rounded-3xl border border-brand/30 bg-background p-5">
                <LocationForm
                    form={PickupLocationController.update.form(location.id)}
                    location={location}
                    submitLabel="Save location"
                    onDone={() => setIsEditing(false)}
                />
            </li>
        );
    }

    return (
        <li className="flex flex-col gap-4 rounded-3xl border bg-background p-5">
            <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <MapPin className="size-5" />
                </span>
                <div className="min-w-0">
                    <h3 className="font-display text-lg leading-snug font-bold tracking-tight">
                        {location.address}
                        {isMain && (
                            <span className="ml-2 inline-flex translate-y-[-2px] items-center rounded-full bg-brand px-2 py-0.5 align-middle font-sans text-[10px] font-semibold tracking-wider text-brand-foreground uppercase">
                                Main
                            </span>
                        )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {location.city}
                    </p>
                </div>
            </div>
            <div className="mt-auto flex items-center justify-between gap-3 border-t border-dashed pt-4">
                <span className="text-sm text-muted-foreground">
                    {carsCount} {carsCount === 1 ? 'car' : 'cars'} here
                </span>
                <div className="flex flex-wrap justify-end gap-1">
                    {!isMain && canBecomeMain && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                router.put(
                                    MainPickupLocationController.url(
                                        location.id,
                                    ),
                                    {},
                                    { preserveScroll: true },
                                )
                            }
                        >
                            <Star /> Make main
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                    >
                        <Pencil /> Edit
                    </Button>
                    {carsCount === 0 && !isMain ? (
                        <ConfirmDialog
                            trigger={
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 /> Remove
                                </Button>
                            }
                            title={`Remove ${location.address}?`}
                            description="Renters will no longer see this pickup location."
                            confirmLabel="Remove"
                            onConfirm={() =>
                                router.delete(
                                    PickupLocationController.destroy.url(
                                        location.id,
                                    ),
                                    { preserveScroll: true },
                                )
                            }
                        />
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            title={
                                isMain
                                    ? 'Make another location main first'
                                    : 'Move its cars to another location first'
                            }
                        >
                            <Trash2 /> Remove
                        </Button>
                    )}
                </div>
            </div>
        </li>
    );
}

export default function LessorPickupLocations({
    pickupLocations,
    mainPickupLocationId,
}: {
    pickupLocations: PickupLocation[];
    mainPickupLocationId: number | null;
}) {
    const canAddLocation =
        usePlanFeature('multiple_locations') || pickupLocations.length === 0;
    return (
        <>
            <Head title="Pickup locations" />

            <div className="mx-auto w-full max-w-5xl space-y-8 p-4 md:p-8">
                <PageHeader
                    eyebrow="Where renters meet you"
                    title="Pickup locations"
                    description="Add every place you hand cars over, like your branch or the airport. Each car is picked up at one of these."
                />

                {pickupLocations.length > 0 && (
                    <ul className="grid gap-4 md:grid-cols-2">
                        {pickupLocations.map((location) => (
                            <LocationCard
                                key={location.id}
                                location={location}
                                isMain={location.id === mainPickupLocationId}
                                canBecomeMain={mainPickupLocationId !== null}
                            />
                        ))}
                    </ul>
                )}

                {canAddLocation ? (
                    <section className="rounded-3xl border-2 border-dashed p-5 sm:p-6">
                        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold tracking-tight">
                            <Plus className="size-5 text-brand" />
                            {pickupLocations.length > 0
                                ? 'Add another location'
                                : 'Add your first pickup location'}
                        </h2>
                        <LocationForm
                            form={PickupLocationController.store.form()}
                            submitLabel="Add location"
                        />
                    </section>
                ) : (
                    <p className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border-2 border-dashed p-5 text-sm text-muted-foreground">
                        Your plan includes one pickup location.
                        <UpgradeNote plans="Fleet">
                            More locations are on Fleet
                        </UpgradeNote>
                    </p>
                )}
            </div>
        </>
    );
}

LessorPickupLocations.layout = {
    breadcrumbs: [
        { title: 'Pickup locations', href: lessor.pickupLocations.index() },
    ],
};
