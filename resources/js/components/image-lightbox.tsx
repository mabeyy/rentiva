import type { ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/**
 * A thumbnail that opens its image large in a pop-up on the same page,
 * instead of a new tab. `children` is what's shown before opening.
 */
export function ImageLightbox({
    src,
    alt,
    children,
    className,
    label = 'Enlarge image',
}: {
    src: string;
    alt: string;
    children: ReactNode;
    className?: string;
    /** Spoken name of the thumbnail button. */
    label?: string;
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    type="button"
                    aria-label={label}
                    className={cn(
                        'cursor-zoom-in transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
                        className,
                    )}
                >
                    {children}
                </button>
            </DialogTrigger>
            <DialogContent className="w-auto max-w-[calc(100vw-2rem)] p-3 sm:max-w-3xl">
                <DialogTitle className="sr-only">{alt}</DialogTitle>
                <DialogDescription className="sr-only">
                    Press Escape to close.
                </DialogDescription>
                <img
                    src={src}
                    alt={alt}
                    className="mx-auto max-h-[80vh] w-auto rounded-lg bg-white object-contain"
                />
            </DialogContent>
        </Dialog>
    );
}
