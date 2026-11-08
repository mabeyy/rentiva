import { Link } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';

/**
 * A small "on Growth and Fleet" note linking to Billing, for a feature the
 * owner's plan doesn't include.
 */
export function UpgradeNote({
    plans = 'Growth and Fleet',
    className,
    children,
}: {
    plans?: string;
    className?: string;
    children?: ReactNode;
}) {
    return (
        <Link
            href={lessor.billing.index()}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground',
                className,
            )}
        >
            <Lock className="size-3" />
            {children ?? `On ${plans}`}
        </Link>
    );
}
