import { router } from '@inertiajs/react';
import LessorController from '@/actions/App/Http/Controllers/Admin/LessorController';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import type { Lessor } from '@/types';

/**
 * Suspend (hides all their cars) or reinstate a lessor, with confirmation.
 */
export function LessorStatusButton({ lessor }: { lessor: Lessor }) {
    const isSuspended = lessor.status.value === 'suspended';

    function toggle(): void {
        router.patch(
            LessorController.update.url(lessor.id),
            { status: isSuspended ? 'active' : 'suspended' },
            { preserveScroll: true },
        );
    }

    return (
        <ConfirmDialog
            trigger={
                <Button variant={isSuspended ? 'default' : 'destructive'}>
                    {isSuspended ? 'Reinstate lessor' : 'Suspend lessor'}
                </Button>
            }
            title={`${isSuspended ? 'Reinstate' : 'Suspend'} ${lessor.name}?`}
            description={
                isSuspended
                    ? 'Their approved cars become visible to renters again.'
                    : 'All of their cars are hidden from renters and they cannot edit listings. Existing bookings are not cancelled.'
            }
            confirmLabel={isSuspended ? 'Reinstate' : 'Suspend'}
            onConfirm={toggle}
        />
    );
}
