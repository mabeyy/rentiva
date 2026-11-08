import { usePage } from '@inertiajs/react';

/**
 * Whether the owner's plan unlocks a feature, e.g. "exports". Shared by the
 * server for owners and their staff.
 */
export function usePlanFeature(feature: string): boolean {
    const features = usePage<{ planFeatures?: string[] | null }>().props
        .planFeatures;

    return features?.includes(feature) ?? false;
}
