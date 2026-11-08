import { Form, router } from '@inertiajs/react';
import { useState } from 'react';
import CarController from '@/actions/App/Http/Controllers/Admin/CarController';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { Car, CarStatus, Option } from '@/types';

const actionLabels: Partial<Record<CarStatus, string>> = {
    active: 'Approve',
    rejected: 'Reject',
    suspended: 'Suspend',
};

/** Statuses that require the admin to tell the lessor why. */
const statusesNeedingReason: CarStatus[] = ['rejected', 'suspended'];

/**
 * Approve, reject or suspend a listing. Reject and suspend ask for a reason.
 */
export function CarModerationActions({
    car,
    statuses,
}: {
    car: Car;
    statuses: Option<CarStatus>[];
}) {
    const [reasonFor, setReasonFor] = useState<Option<CarStatus> | null>(null);
    const available = statuses.filter(
        (status) => status.value !== car.status.value,
    );

    function moderate(status: Option<CarStatus>): void {
        if (statusesNeedingReason.includes(status.value)) {
            setReasonFor(status);

            return;
        }

        router.patch(
            CarController.update.url(car.slug),
            { status: status.value },
            { preserveScroll: true },
        );
    }

    return (
        <div className="flex flex-wrap gap-2">
            {available.map((status) => (
                <Button
                    key={status.value}
                    variant={status.value === 'active' ? 'default' : 'outline'}
                    onClick={() => moderate(status)}
                >
                    {actionLabels[status.value] ?? status.label}
                </Button>
            ))}

            <Dialog
                open={reasonFor !== null}
                onOpenChange={(open) => !open && setReasonFor(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {reasonFor && actionLabels[reasonFor.value]}{' '}
                            {car.name}
                        </DialogTitle>
                        <DialogDescription>
                            The lessor receives this reason by email and sees it
                            on the listing.
                        </DialogDescription>
                    </DialogHeader>
                    <Form
                        {...CarController.update.form(car.slug)}
                        options={{ preserveScroll: true }}
                        onSuccess={() => setReasonFor(null)}
                        className="space-y-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <input
                                    type="hidden"
                                    name="status"
                                    value={reasonFor?.value ?? ''}
                                />
                                <FormField
                                    id="reason"
                                    label="Reason"
                                    error={errors.reason ?? errors.status}
                                >
                                    <Textarea
                                        id="reason"
                                        name="reason"
                                        rows={3}
                                        required
                                        placeholder="e.g. Photos don't show the car's interior."
                                    />
                                </FormField>
                                <DialogFooter>
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        disabled={processing}
                                    >
                                        {reasonFor &&
                                            actionLabels[reasonFor.value]}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
