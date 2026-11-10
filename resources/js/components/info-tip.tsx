import { Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * A small "i" next to a label that explains it on hover, keyboard focus or
 * tap (phones have no hover, so a tap toggles it).
 */
export function InfoTip({
    children,
    label = 'What does this mean?',
    className,
}: {
    children: ReactNode;
    label?: string;
    className?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Tooltip open={isOpen} onOpenChange={setIsOpen}>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    aria-label={label}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setIsOpen((open) => !open);
                    }}
                    className={cn(
                        'inline-flex size-4 shrink-0 items-center justify-center rounded-full align-middle text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
                        className,
                    )}
                >
                    <Info className="size-3.5" />
                </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64 text-pretty">
                {children}
            </TooltipContent>
        </Tooltip>
    );
}

/**
 * Wraps any element so hovering or focusing it shows a short explanation,
 * for compact markers like the calendar's counts.
 */
export function Hint({
    text,
    children,
}: {
    text: ReactNode;
    children: ReactNode;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent className="max-w-64 text-pretty">
                {text}
            </TooltipContent>
        </Tooltip>
    );
}
