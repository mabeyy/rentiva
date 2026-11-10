import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { InfoTip } from '@/components/info-tip';
import { cn } from '@/lib/utils';
import type { RouteDefinition } from '@/wayfinder';

/**
 * A single dashboard number. `highlighted` paints it in the brand color to
 * pull the eye to something that needs attention; `href` makes the whole
 * card a shortcut to the page behind the number. `dense` drops the icon and
 * tightens padding on phones, for a two-column grid. `info` adds an
 * explanation behind an "i" next to the label.
 */
export function StatCard({
    label,
    value,
    icon: Icon,
    hint,
    href,
    highlighted = false,
    dense = false,
    info,
}: {
    label: string;
    value: string | number;
    icon: LucideIcon;
    hint?: string;
    href?: RouteDefinition<'get'>;
    highlighted?: boolean;
    dense?: boolean;
    /** A short explanation shown from an "i" beside the label. */
    info?: ReactNode;
}) {
    const content = (
        <>
            <span
                className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-brand',
                    highlighted && 'bg-brand text-brand-foreground',
                    dense && 'hidden sm:flex',
                )}
            >
                <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
                <p
                    className={cn(
                        'text-sm font-medium text-muted-foreground',
                        dense ? 'leading-snug sm:truncate' : 'truncate',
                    )}
                >
                    {label}
                    {info && <InfoTip className="ml-1">{info}</InfoTip>}
                </p>
                <p className="mt-0.5 font-display text-2xl leading-tight font-extrabold tracking-tight tabular-nums">
                    {value}
                </p>
                {hint && (
                    <p
                        className={cn(
                            'text-xs text-muted-foreground',
                            dense ? 'sm:truncate' : 'truncate',
                            highlighted && 'font-medium text-brand',
                        )}
                    >
                        {hint}
                    </p>
                )}
            </div>
            {href && (
                <ArrowUpRight className="size-4 shrink-0 self-start text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
            )}
        </>
    );
    const className = cn(
        'group flex items-center gap-4 rounded-3xl border bg-background p-4',
        dense && 'gap-2 rounded-2xl p-3 sm:gap-4 sm:rounded-3xl sm:p-4',
        highlighted && 'border-brand/40 bg-brand/5',
        href &&
            'transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none',
    );

    return href ? (
        <Link href={href} className={className}>
            {content}
        </Link>
    ) : (
        <div className={className}>{content}</div>
    );
}
