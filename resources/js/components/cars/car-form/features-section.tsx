import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Feature } from '@/types';

export function FeaturesSection({
    features,
    selected,
    error,
}: {
    features: Feature[];
    selected: Feature[];
    error?: string;
}) {
    const selectedIds = new Set(selected.map((feature) => feature.id));

    return (
        <div className="space-y-2">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((feature) => (
                    <div key={feature.id} className="flex items-center gap-2">
                        <Checkbox
                            id={`feature-${feature.id}`}
                            name="features[]"
                            value={String(feature.id)}
                            defaultChecked={selectedIds.has(feature.id)}
                        />
                        <Label
                            htmlFor={`feature-${feature.id}`}
                            className="font-normal"
                        >
                            {feature.name}
                        </Label>
                    </div>
                ))}
            </div>
            <InputError message={error} />
        </div>
    );
}
