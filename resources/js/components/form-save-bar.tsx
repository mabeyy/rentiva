import { Link } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { BrandButton } from '@/components/public/brand-button';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { RouteDefinition } from '@/wayfinder';

/**
 * Compact save control that floats at the bottom right of a long form, with a
 * short note on what saving does and an optional way back.
 */
export function FormSaveBar({
    label,
    hint,
    processing,
    progress,
    cancelHref,
    testId,
}: {
    label: string;
    hint?: string;
    processing: boolean;
    /** Upload progress in percent, shown instead of the hint while uploading. */
    progress?: number | null;
    cancelHref?: RouteDefinition<'get'>;
    /** `data-test` hook for browser tests. */
    testId?: string;
}) {
    return (
        <div className="pointer-events-none sticky bottom-4 z-10 flex justify-end">
            <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-full border bg-background/95 p-1.5 shadow-[0_16px_40px_-16px_color-mix(in_oklch,var(--ink)_45%,transparent)] backdrop-blur">
                {(progress !== null && progress !== undefined) || hint ? (
                    <p className="hidden truncate px-3 text-sm text-muted-foreground sm:block">
                        {progress !== null && progress !== undefined
                            ? `Uploading photos… ${progress}%`
                            : hint}
                    </p>
                ) : null}
                {cancelHref && (
                    <Button
                        variant="ghost"
                        className="h-10 rounded-full px-4"
                        asChild
                    >
                        <Link href={cancelHref}>Cancel</Link>
                    </Button>
                )}
                <BrandButton
                    type="submit"
                    data-test={testId}
                    className="h-10 rounded-full px-5"
                    disabled={processing}
                >
                    {processing ? <Spinner /> : <Check />}
                    {label}
                </BrandButton>
            </div>
        </div>
    );
}
