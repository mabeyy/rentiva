import type { ReactNode } from 'react';

/**
 * Owner-area page title in the landing page's display style, with actions on
 * the right.
 */
export function PageHeader({
    title,
    description,
    actions,
}: {
    title: ReactNode;
    description?: string;
    actions?: ReactNode;
}) {
    return (
        <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
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
