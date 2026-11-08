import { Form } from '@inertiajs/react';
import LessorRetentionController from '@/actions/App/Http/Controllers/Admin/LessorRetentionController';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { UnitInput } from '@/components/unit-input';

export type LessorRetention = {
    /** Null when the owner follows the platform's period. */
    data_retention_months: number | null;
    proof_retention_days: number | null;
    platform_data_retention_months: number;
    platform_proof_retention_days: number;
};

/**
 * Lets an admin give one owner their own retention periods. Blank fields
 * follow the platform's.
 */
export function LessorRetentionForm({
    lessorId,
    retention,
}: {
    lessorId: number;
    retention: LessorRetention;
}) {
    return (
        <Form
            {...LessorRetentionController.form(lessorId)}
            options={{ preserveScroll: true }}
            className="rounded-xl border p-4"
        >
            {({ processing, errors, isDirty }) => (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <FormField
                        id="data_retention_months"
                        label="Keep renter details for"
                        error={errors.data_retention_months}
                    >
                        <UnitInput
                            id="data_retention_months"
                            name="data_retention_months"
                            defaultValue={retention.data_retention_months}
                            placeholder={String(
                                retention.platform_data_retention_months,
                            )}
                            unit="months"
                            min={1}
                            max={120}
                        />
                    </FormField>
                    <FormField
                        id="proof_retention_days"
                        label="Keep transfer screenshots for"
                        error={errors.proof_retention_days}
                    >
                        <UnitInput
                            id="proof_retention_days"
                            name="proof_retention_days"
                            defaultValue={retention.proof_retention_days}
                            placeholder={String(
                                retention.platform_proof_retention_days,
                            )}
                            unit="days"
                            min={1}
                            max={365}
                        />
                    </FormField>
                    <Button
                        type="submit"
                        variant="secondary"
                        disabled={processing || !isDirty}
                    >
                        Save
                    </Button>
                    <p className="text-xs text-muted-foreground sm:ml-auto sm:max-w-56 sm:text-right">
                        Leave blank to follow the platform’s period, shown
                        faded.
                    </p>
                </div>
            )}
        </Form>
    );
}
