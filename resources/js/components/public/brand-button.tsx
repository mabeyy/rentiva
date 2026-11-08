import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * shadcn Button in the landing page's sunset-orange brand color.
 */
export function BrandButton({
    className,
    ...props
}: ComponentProps<typeof Button>) {
    return (
        <Button
            className={cn(
                'bg-brand text-brand-foreground shadow-[0_8px_24px_-8px_var(--brand)] hover:bg-brand/90',
                className,
            )}
            {...props}
        />
    );
}
