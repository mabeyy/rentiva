import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { FormSaveBar } from '@/components/form-save-bar';
import { FormSection } from '@/components/lessor/form-section';
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
};

/**
 * Create/edit form for a listing. Field names match the Laravel form requests.
 */
export function CarForm({
    form,
    car,
    options,
    submitLabel,
}: {
    form: RouteFormDefinition<'post'>;
    car?: Car;
    options: CarFormOptions;
    submitLabel: string;
}) {
    const {
        bodyTypes,
        features,
        pickupLocations,
        mainPickupLocationId,
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
                        step={1}
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
                        step={2}
                        title="Pricing & extras"
                        description="Your daily rate, deposit, long-stay discounts, and delivery or a driver if you offer them."
                    >
                        <PricingSection car={car} errors={errors} />
                    </FormSection>
                    <FormSection
                        step={3}
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
                        step={4}
                        title="Features"
                        description="Select everything the car comes with."
                    >
                        <FeaturesSection
                            features={features}
                            selected={car?.features ?? []}
                            error={errors.features}
                        />
                    </FormSection>
                    <FormSection
                        step={5}
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
                        step={6}
                        title="Papers"
                        description="Optional. Only you see these, and we remind you before they run out."
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
