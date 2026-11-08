import { router, usePage } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { stop } from '@/routes/impersonation';

/**
 * Shown while an admin is viewing the app as an owner, with a way back.
 * Anything they do is logged under the admin's name.
 */
export function ImpersonationBanner() {
    const impersonation = usePage<{
        impersonation?: { admin_name: string; owner_name: string } | null;
    }>().props.impersonation;

    if (!impersonation) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 bg-ink px-6 py-2 text-sm text-ink-foreground md:px-4">
            <Eye className="size-4 shrink-0" />
            <span className="flex-1">
                You're viewing as{' '}
                <span className="font-semibold">
                    {impersonation.owner_name}
                </span>
                . Changes are logged under {impersonation.admin_name}.
            </span>
            <button
                type="button"
                onClick={() => router.post(stop().url)}
                className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium transition-colors hover:bg-white/25"
            >
                Back to admin
            </button>
        </div>
    );
}
