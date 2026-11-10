import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { FormSaveBar } from '@/components/form-save-bar';
import { FormSection } from '@/components/lessor/form-section';
import type { Extras } from '@/components/lessor/extras-fields';
import { isTwoWheeler } from '@/lib/vehicle';
import lessor from '@/routes/lessor';
import type { Car, CarSpecOptions, Feature, PickupLocation } from '@/types';
import type { RouteFormDefinition } from '@/wayfinder';
import { BasicInfoSection } from './basic-info-section';
import { FeaturesSection } from './features-section';
import { PhotosSection } from './photos-section';
import { PapersSection } from './papers-section';
import { PricingSection } from './pricing-section';
import { SpecsSection } from './specs-section';

export type CarFormOptions = CarSpecOptions & {
    features: Feature[];
    pickupLocations: PickupLocation[];
    /** Pre-selected for new listings. */
    mainPickupLocationId: number | null;
    /** The business-wide discounts, extras and deposit cars follow by default. */
    defaultExtras: Extras;
};

/** The form's sections in order, for the edit page's section menu. */
export const carFormSections = [
    { id: 'car-basics', label: 'Basic information' },
    { id: 'car-photos', label: 'Photos' },
    { id: 'car-pricing', label: 'Pricing & extras' },
    { id: 'car-specs', label: 'Specifications' },
    { id: 'car-features', label: 'Features' },
    { id: 'car-papers', label: 'Papers' },
] as const;

/**
 * Create/edit form for a listing. Field names match the Laravel form requests.
 */
export function CarForm({
    form,
    car,
    options,
    submitLabel,
    numbered = true,
}: {
    form: RouteFormDefinition<'post'>;
    car?: Car;
    options: CarFormOptions;
    submitLabel: string;
    /** Number the sections like steps; on for a new listing, off when editing. */
    numbered?: boolean;
}) {
    const {
        bodyTypes,
        features,
        pickupLocations,
        mainPickupLocationId,
        defaultExtras,
        ...specOptions
    } = options;
    const [bodyType, setBodyType] = useState<string | null>(
        car?.body_type.value ?? null,
    );

    return (
        <Form
            {...form}
            options={{ preserveScroll: true }}
            className="space-y-6"
        >
            {({ processing, errors, progress }) => (
                <>
                    <FormSection
                        id="car-basics"
                        step={numbered ? 1 : undefined}
                        title="Basic information"
                        description="What renters see first."
                    >
                        <BasicInfoSection
                            car={car}
                            bodyTypes={bodyTypes}
                            errors={errors}
                            onBodyTypeChange={setBodyType}
                            pickupLocations={pickupLocations}
                            mainPickupLocationId={mainPickupLocationId}
                        />
                    </FormSection>
                    <FormSection
                        id="car-photos"
                        step={numbered ? 2 : undefined}
                        title="Photos"
                        description="The first photo is the cover. Add at least one."
                    >
                        <PhotosSection
                            key={car?.images?.map((image) => image.id).join()}
                            existingImages={car?.images}
                            errors={errors}
                        />
                    </FormSection>
                    <FormSection
                        id="car-pricing"
                        step={numbered ? 3 : undefined}
                        title="Pricing & extras"
                        description="The daily rate, plus discounts, deposit, delivery and a driver."
                    >
                        <PricingSection
                            car={car}
                            defaults={defaultExtras}
                            errors={errors}
                        />
                    </FormSection>
                    <FormSection
                        id="car-specs"
                        step={numbered ? 4 : undefined}
                        title="Specifications"
                        description="Capacity, transmission and fuel economy."
                    >
                        <SpecsSection
                            car={car}
                            options={specOptions}
                            errors={errors}
                            isTwoWheeler={isTwoWheeler(bodyType)}
                        />
                    </FormSection>
                    <FormSection
                        id="car-features"
                        step={numbered ? 5 : undefined}
                        title="Features"
                        description="Tick everything it comes with. Only features that fit the vehicle type show."
                    >
                        <FeaturesSection
                            features={features}
                            selected={car?.features ?? []}
                            isTwoWheeler={isTwoWheeler(bodyType)}
                            error={errors.features}
                        />
                    </FormSection>
                    <FormSection
                        id="car-papers"
                        step={numbered ? 6 : undefined}
                        title="Papers"
                        description="Optional. Only you see these, and we remind you before the registration runs out."
                    >
                        <PapersSection car={car} errors={errors} />
                    </FormSection>

                    <FormSaveBar
                        label={submitLabel}
                        hint={
                            car
                                ? 'Changes go live right away on approved listings.'
                                : 'Saved as a draft. Submit it for review when ready.'
                        }
                        processing={processing}
                        progress={progress?.percentage}
                        cancelHref={lessor.cars.index()}
                    />
                </>
            )}
        </Form>
    );
}
