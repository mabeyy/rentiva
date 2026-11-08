import type { ReactNode } from 'react';

/**
 * Owner-area page title in the landing page's display style, with an
 * optional eyebrow above it and actions on the right.
 */
export function PageHeader({
    eyebrow,
    title,
    description,
    actions,
}: {
    eyebrow?: string;
    title: ReactNode;
    description?: string;
    actions?: ReactNode;
}) {
    return (
        <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
                {eyebrow && (
                    <p className="mb-3 flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                        <span
                            aria-hidden
                            className="h-0.5 w-8 rounded-full bg-brand"
                        />
                        {eyebrow}
                    </p>
                )}
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
                    {title}
                </h1>
                {description && (
                    <p className="mt-2 max-w-2xl text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </header>
    );
}
