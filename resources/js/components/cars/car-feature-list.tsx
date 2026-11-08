import { Check } from 'lucide-react';
import type { Feature } from '@/types';

export function CarFeatureList({ features }: { features: Feature[] }) {
    return (
        <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
                <li key={feature.id} className="flex items-center gap-2.5">
                    <Check
                        aria-hidden
                        className="size-4 shrink-0 text-brand"
                        strokeWidth={2.5}
                    />
                    {feature.name}
                </li>
            ))}
        </ul>
    );
}
