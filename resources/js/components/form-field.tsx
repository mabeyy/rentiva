import type { ReactNode } from 'react';
import { InfoTip } from '@/components/info-tip';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Label, control and validation message stacked consistently. `info` adds
 * an explanation behind an "i" beside the label.
 */
export function FormField({
    id,
    label,
    error,
    hint,
    info,
    className,
    children,
}: {
    id: string;
    label: string;
    error?: string;
    hint?: string;
    info?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cn('grid content-start gap-2', className)}>
            <div className="flex min-h-4 items-center gap-1">
                <Label htmlFor={id}>{label}</Label>
                {info && <InfoTip>{info}</InfoTip>}
            </div>
            {children}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            <InputError message={error} />
        </div>
    );
}
