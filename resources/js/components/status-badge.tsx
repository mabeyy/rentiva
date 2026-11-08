import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Option } from '@/types';

const toneClasses: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    confirmed:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    completed: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
    pending:
        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    pending_review:
        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    declined: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    suspended: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    inactive: 'bg-muted text-muted-foreground',
    unpaid: 'bg-muted text-muted-foreground',
    submitted:
        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
};

/**
 * Colored badge for any car, booking or user status option.
 */
export function StatusBadge({ status }: { status: Option }) {
    return (
        <Badge
            variant="secondary"
            className={cn('border-transparent', toneClasses[status.value])}
        >
            {status.label}
        </Badge>
    );
}
