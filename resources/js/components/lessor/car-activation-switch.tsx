import { router } from '@inertiajs/react';
import { useState } from 'react';
import CarActivationController from '@/actions/App/Http/Controllers/Lessor/CarActivationController';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { Car } from '@/types';

/**
 * On/off switch for an approved listing: on shows it to renters, off hides it
 * without another review. Renders nothing for listings that can't be toggled.
 */
export function CarActivationSwitch({
    car,
    className,
}: {
    car: Car;
    className?: string;
}) {
    const [isSaving, setIsSaving] = useState(false);
    const isActive = car.status.value === 'active';
    const id = `car-${car.id}-active`;

    if (!['active', 'inactive'].includes(car.status.value)) {
        return null;
    }

    function toggle(active: boolean): void {
        router.put(
            CarActivationController.update.url(car.slug),
            { active },
            {
                preserveScroll: true,
                onStart: () => setIsSaving(true),
                onFinish: () => setIsSaving(false),
            },
        );
    }

    return (
        <label
            htmlFor={id}
            className={cn(
                'flex cursor-pointer items-center gap-2 text-sm font-medium',
                className,
            )}
        >
            <Switch
                id={id}
                checked={isActive}
                disabled={isSaving}
                onCheckedChange={toggle}
                className="data-[state=checked]:bg-brand"
            />
            <span className={cn(!isActive && 'text-muted-foreground')}>
                {isActive ? 'Visible' : 'Hidden'}
            </span>
        </label>
    );
}
