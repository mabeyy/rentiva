import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A titled block of an owner-area form. Pass `step` to number it like the
 * landing page's setup steps.
 */
export function FormSection({
    step,
    title,
    description,
    className,
    children,
}: {
    step?: number;
    title: string;
    description: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section
            className={cn(
                'rounded-3xl border bg-background p-5 sm:p-8',
                className,
            )}
        >
            <header className="mb-6 flex items-start gap-4">
                {step !== undefined && (
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand font-display text-sm font-bold text-brand-foreground">
                        {step}
                    </span>
                )}
                <div>
                    <h2 className="font-display text-xl font-bold tracking-tight">
                        {title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
            </header>
            {children}
        </section>
    );
}
