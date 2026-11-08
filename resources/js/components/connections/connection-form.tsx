import { router } from '@inertiajs/react';
import { FlaskConical, Unplug } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { FormSaveBar } from '@/components/form-save-bar';
import { FormSection } from '@/components/lessor/form-section';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

/**
 * Settings card + test box + save bar + disconnect, shared by the email, SMS
 * and calendar pages. The page owns the fields and the Inertia form state.
 */
export function ConnectionForm({
    title,
    description,
    status,
    fields,
    test,
    onSave,
    onTest,
    processing,
    isTesting,
    canDisconnect,
    disconnectUrl,
    disconnectLabel,
}: {
    title: string;
    description: string;
    status: ReactNode;
    fields: ReactNode;
    /** Fields for the test (e.g. who to send it to). */
    test: ReactNode;
    onSave: () => void;
    onTest: () => void;
    processing: boolean;
    isTesting: boolean;
    canDisconnect: boolean;
    disconnectUrl: string;
    disconnectLabel: string;
}) {
    function submit(event: FormEvent): void {
        event.preventDefault();
        onSave();
    }

    return (
        <form onSubmit={submit} className="space-y-6">
            <FormSection title={title} description={description}>
                <div className="space-y-5">
                    <div>{status}</div>
                    {fields}
                </div>
            </FormSection>

            <FormSection
                title="Send a test"
                description="Uses what's typed above, even before you save."
            >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">{test}</div>
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        onClick={onTest}
                        disabled={isTesting}
                    >
                        {isTesting ? <Spinner /> : <FlaskConical />}
                        Send test
                    </Button>
                </div>
            </FormSection>

            {canDisconnect && (
                <div className="flex justify-end">
                    <ConfirmDialog
                        trigger={
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                            >
                                <Unplug /> Disconnect
                            </Button>
                        }
                        title={`Disconnect ${title.toLowerCase()}?`}
                        description={disconnectLabel}
                        confirmLabel="Disconnect"
                        onConfirm={() =>
                            router.put(
                                disconnectUrl,
                                { disconnect: true },
                                { preserveScroll: true },
                            )
                        }
                    />
                </div>
            )}

            <FormSaveBar
                label="Save"
                hint="Keys are stored encrypted and never shown again."
                processing={processing}
            />
        </form>
    );
}
