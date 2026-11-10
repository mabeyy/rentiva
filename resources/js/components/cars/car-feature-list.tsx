import { Check } from 'lucide-react';
import { groupFeatures } from '@/lib/features';
import type { Feature } from '@/types';

/** A car's features on its public page, grouped like the car form. */
export function CarFeatureList({ features }: { features: Feature[] }) {
    return (
        <div className="grid gap-6 sm:grid-cols-2">
            {groupFeatures(features).map((group) => (
                <div key={group.label}>
                    <h3 className="mb-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        {group.label}
                    </h3>
                    <ul className="space-y-2">
                        {group.features.map((feature) => (
                            <li
                                key={feature.id}
                                className="flex items-center gap-2.5"
                            >
                                <Check
                                    aria-hidden
                                    className="size-4 shrink-0 text-brand"
                                    strokeWidth={2.5}
                                />
                                {feature.name}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}
