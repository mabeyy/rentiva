import { Link } from '@inertiajs/react';
import { Check, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Hint } from '@/components/info-tip';

export type ChecklistStep = {
    key: string;
    label: string;
    done: boolean;
    href: string;
};

const DISMISS_KEY = 'rentiva:setup-checklist-dismissed';

/**
 * The first things a new owner sets up, with progress. Hidden once all are
 * done, or until they bring it back by clearing the dismissal.
 */
export function SetupChecklist({ steps }: { steps: ChecklistStep[] }) {
    const [isDismissed, setIsDismissed] = useState(() => {
        try {
            return localStorage.getItem(DISMISS_KEY) === '1';
        } catch {
            return false;
        }
    });
    const doneCount = steps.filter((step) => step.done).length;
    const nextStep = steps.find((step) => !step.done);

    if (isDismissed) {
        return null;
    }

    function dismiss(): void {
        setIsDismissed(true);

        try {
            localStorage.setItem(DISMISS_KEY, '1');
        } catch {
            // Private mode: it just comes back next time.
        }
    }

    return (
        <section className="rounded-3xl border bg-background p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="font-display text-lg font-bold tracking-tight">
                        Get set up
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {doneCount} of {steps.length} done
                        {nextStep && ` · next: ${nextStep.label.toLowerCase()}`}
                    </p>
                </div>
                <Hint text="Hide checklist">
                    <button
                        type="button"
                        aria-label="Hide checklist"
                        className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        onClick={dismiss}
                    >
                        <X className="size-4" />
                    </button>
                </Hint>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <span
                    className="block h-full rounded-full bg-brand transition-all"
                    style={{ width: `${(doneCount / steps.length) * 100}%` }}
                />
            </div>
            <ol className="mt-4 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                {steps.map((step) => (
                    <li key={step.key}>
                        <Link
                            href={step.href}
                            className={cn(
                                'group flex items-center gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-muted/60',
                                step.done && 'text-muted-foreground',
                            )}
                        >
                            <span
                                className={cn(
                                    'flex size-6 shrink-0 items-center justify-center rounded-full border',
                                    step.done
                                        ? 'border-brand bg-brand text-brand-foreground'
                                        : 'border-dashed',
                                )}
                            >
                                {step.done && <Check className="size-3.5" />}
                            </span>
                            <span
                                className={cn(
                                    'flex-1',
                                    step.done && 'line-through',
                                )}
                            >
                                {step.label}
                            </span>
                            {!step.done && (
                                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                            )}
                        </Link>
                    </li>
                ))}
            </ol>
        </section>
    );
}
