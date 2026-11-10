import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Numbered "how to set this up" guide shown above a connection's settings.
 * `collapsible` folds it behind its title, for pages with several guides.
 */
export function SetupSteps({
    title = 'How to set it up',
    steps,
    collapsible = false,
}: {
    title?: string;
    steps: ReactNode[];
    collapsible?: boolean;
}) {
    const list = (
        <ol className="space-y-2.5 text-sm text-muted-foreground">
            {steps.map((step, index) => (
                <li key={index} className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand font-display text-xs font-bold text-brand-foreground">
                        {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                </li>
            ))}
        </ol>
    );

    if (collapsible) {
        return (
            <details className="group rounded-3xl border bg-muted/30 p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    {title}
                    <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-3">{list}</div>
            </details>
        );
    }

    return (
        <section className="rounded-3xl border bg-muted/30 p-5">
            <h2 className="mb-3 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {title}
            </h2>
            {list}
        </section>
    );
}

/** An external link inside a setup step, opening in a new tab. */
export function StepLink({
    href,
    children,
}: {
    href: string;
    children: ReactNode;
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-4"
        >
            {children}
        </a>
    );
}
