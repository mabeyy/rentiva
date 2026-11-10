import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A titled block of an owner-area form. Pass `step` to number it like the
 * landing page's setup steps.
 */
export function FormSection({
    id,
    step,
    title,
    description,
    className,
    children,
}: {
    /** Anchor for in-page links, e.g. the edit page's section menu. */
    id?: string;
    step?: number;
    title: string;
    description: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section
            id={id}
            className={cn(
                'scroll-mt-6 rounded-3xl border bg-background p-5 sm:p-8',
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
