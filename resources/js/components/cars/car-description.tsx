import { useState } from 'react';
import { cn } from '@/lib/utils';

/** Descriptions longer than this get clamped behind a "Read more" toggle. */
const PREVIEW_LENGTH = 220;

/**
 * The owner's own words about a car, set as a short pull-quote under the
 * title so renters get the story before the spec sheet.
 */
export function CarDescription({ description }: { description: string }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const isLong = description.length > PREVIEW_LENGTH;

    return (
        <section className="rounded-r-2xl border-l-4 border-brand bg-muted/40 py-4 pr-5 pl-5">
            <h2 className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                About this car
            </h2>
            <p
                className={cn(
                    'mt-2 text-[17px] leading-relaxed whitespace-pre-line text-foreground/85',
                    !isExpanded && 'line-clamp-3',
                )}
            >
                {description}
            </p>
            {isLong && (
                <button
                    type="button"
                    onClick={() => setIsExpanded((expanded) => !expanded)}
                    className="mt-2 text-sm font-medium underline underline-offset-4"
                >
                    {isExpanded ? 'Show less' : 'Read more'}
                </button>
            )}
        </section>
    );
}
