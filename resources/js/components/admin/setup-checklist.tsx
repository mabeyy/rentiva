import { Link } from '@inertiajs/react';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AdminSetupStep = {
    key: string;
    label: string;
    done: boolean;
    href: string;
};

/**
 * What the admin still has to fill in: plans, payment accounts, and support
 * contacts. Hidden once everything is done.
 */
export function AdminSetupChecklist({ steps }: { steps: AdminSetupStep[] }) {
    const doneCount = steps.filter((step) => step.done).length;

    return (
        <section className="rounded-xl border border-brand/40 bg-brand/5 p-5">
            <h2 className="font-semibold">Finish setting up Rentiva</h2>
            <p className="text-sm text-muted-foreground">
                {doneCount} of {steps.length} done. Owners see these details on
                their invoices and Help page.
            </p>
            <ol className="mt-3 grid gap-1 sm:grid-cols-2">
                {steps.map((step) => (
                    <li key={step.key}>
                        <Link
                            href={step.href}
                            className={cn(
                                'group flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-background',
                                step.done && 'text-muted-foreground',
                            )}
                        >
                            <span
                                className={cn(
                                    'flex size-6 shrink-0 items-center justify-center rounded-full border',
                                    step.done
                                        ? 'border-brand bg-brand text-brand-foreground'
                                        : 'border-dashed bg-background',
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
                                <ChevronRight className="size-4 text-muted-foreground" />
                            )}
                        </Link>
                    </li>
                ))}
            </ol>
        </section>
    );
}
