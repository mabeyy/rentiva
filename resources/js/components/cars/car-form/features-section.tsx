import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { featureFits, groupFeatures } from '@/lib/features';
import type { Feature } from '@/types';

/**
 * The feature checklist, grouped (Comfort, Safety, Tech, Convenience) and
 * showing only what fits the vehicle type, so a scooter offers a helmet
 * rather than Apple CarPlay.
 */
export function FeaturesSection({
    features,
    selected,
    isTwoWheeler,
    error,
}: {
    features: Feature[];
    selected: Feature[];
    isTwoWheeler: boolean;
    error?: string;
}) {
    const selectedIds = new Set(selected.map((feature) => feature.id));
    const groups = groupFeatures(
        features.filter((feature) => featureFits(feature, isTwoWheeler)),
    );

    return (
        <div className="space-y-6">
            {groups.map((group) => (
                <fieldset key={group.label} className="space-y-3">
                    <legend className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        {group.label}
                    </legend>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {group.features.map((feature) => (
                            <div
                                key={feature.id}
                                className="flex items-center gap-2"
                            >
                                <Checkbox
                                    id={`feature-${feature.id}`}
                                    name="features[]"
                                    value={String(feature.id)}
                                    defaultChecked={selectedIds.has(feature.id)}
                                />
                                <Label
                                    htmlFor={`feature-${feature.id}`}
                                    className="leading-snug font-normal"
                                >
                                    {feature.name}
                                </Label>
                            </div>
                        ))}
                    </div>
                </fieldset>
            ))}
            <InputError message={error} />
        </div>
    );
}
