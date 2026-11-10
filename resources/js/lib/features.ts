import type { Feature } from '@/types';

/** Feature groups in display order, matching App\Enums\FeatureCategory. */
export const featureCategories: {
    value: Feature['category'];
    label: string;
}[] = [
    { value: 'comfort', label: 'Comfort' },
    { value: 'safety', label: 'Safety' },
    { value: 'tech', label: 'Tech' },
    { value: 'convenience', label: 'Convenience' },
];

/** Whether a feature makes sense on a car, or on a motorcycle or scooter. */
export function featureFits(feature: Feature, isTwoWheeler: boolean): boolean {
    return (
        feature.vehicles === 'all' ||
        feature.vehicles === (isTwoWheeler ? 'two_wheelers' : 'cars')
    );
}

/** Features split into their groups, in order, leaving out empty groups. */
export function groupFeatures(
    features: Feature[],
): { label: string; features: Feature[] }[] {
    return featureCategories
        .map((category) => ({
            label: category.label,
            features: features.filter(
                (feature) => feature.category === category.value,
            ),
        }))
        .filter((group) => group.features.length > 0);
}
