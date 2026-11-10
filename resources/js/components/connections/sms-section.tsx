import { router, useForm } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import type { ConnectionContext } from '@/components/connections/connections-shell';
import {
    ManagedNotice,
    PlanWarning,
    ConnectionStatus,
} from '@/components/connections/connections-shell';
import { ConnectionForm } from '@/components/connections/connection-form';
import type { ReminderSettings } from '@/components/connections/pickup-reminders';
import { PickupReminders } from '@/components/connections/pickup-reminders';
import { SetupSteps, StepLink } from '@/components/connections/setup-steps';
import { FormField } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export type SmsSettings = {
    has_api_key: boolean;
    sms_sender_name: string | null;
    sms_enabled: boolean;
    test_recipient: string | null;
    reminders: ReminderSettings;
};

const textsSent = [
    'You: a new booking request, a transfer to check, a renter cancelling.',
    'Renters: confirmed, declined or cancelled, payment received or rejected.',
];

const setupSteps: ReactNode[] = [
    <>
        Create an account at{' '}
        <StepLink href="https://semaphore.co/">semaphore.co</StepLink> and
        verify your mobile number.
    </>,
    <>
        Buy credits under <strong className="text-foreground">Billing</strong>.
        Each text uses about one credit per 160 characters.
    </>,
    <>
        Under <strong className="text-foreground">Sender Names</strong>, request
        the business name (up to 11 letters or numbers, like ABQRENTAL) and wait
        for it to be approved. Texts can't be switched on without it, so renters
        never see Semaphore's default sender.
    </>,
    <>
        Open <strong className="text-foreground">Account → API</strong> and copy
        your API key.
    </>,
    'Paste the key below, add the approved sender name, switch SMS on, and send a test to your own phone before saving.',
];

/**
 * The text message part of the Notifications page: pickup reminders, and
 * for admins the setup steps and connection form.
 */
export function SmsSection({
    settings,
    context,
}: {
    settings: SmsSettings;
    context: ConnectionContext;
}) {
    const [isTesting, setIsTesting] = useState(false);
    const form = useForm({
        semaphore_api_key: '',
        sms_sender_name: settings?.sms_sender_name ?? '',
        sms_enabled: settings?.sms_enabled ?? false,
        test_recipient: settings?.test_recipient ?? '',
    });

    return (
        <div className="space-y-4">
            <PickupReminders
                channel="sms"
                reminders={settings.reminders}
                updateUrl={context.urls.reminders}
                policiesUrl={context.urls.policies}
                note={
                    !context.plan.sms
                        ? 'SMS reminders need the Growth or Fleet plan.'
                        : context.canEdit
                          ? 'Texts need SMS switched on below.'
                          : 'Texts go out once SMS is on.'
                }
            />
            {context.canEdit ? (
                <>
                    {!context.plan.sms && (
                        <PlanWarning context={context} feature="SMS texts" />
                    )}
                    <SetupSteps steps={setupSteps} collapsible />
                    <ConnectionForm
                        title="Semaphore"
                        description="Create an account at semaphore.co, load credits, then paste your API key here."
                        status={
                            <ConnectionStatus
                                connected={
                                    settings.has_api_key &&
                                    settings.sms_enabled &&
                                    Boolean(settings.sms_sender_name)
                                }
                            />
                        }
                        fields={
                            <div className="space-y-4">
                                <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border p-4">
                                    <span>
                                        <span className="block font-medium">
                                            Send SMS notifications
                                        </span>
                                        <span className="block text-sm text-muted-foreground">
                                            {textsSent.map((line) => (
                                                <span
                                                    key={line}
                                                    className="block"
                                                >
                                                    {line}
                                                </span>
                                            ))}
                                        </span>
                                    </span>
                                    <Switch
                                        checked={form.data.sms_enabled}
                                        onCheckedChange={(checked) =>
                                            form.setData('sms_enabled', checked)
                                        }
                                        className="data-[state=checked]:bg-brand"
                                    />
                                </label>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField
                                        id="semaphore_api_key"
                                        label="API key"
                                        error={form.errors.semaphore_api_key}
                                        hint={
                                            settings.has_api_key
                                                ? 'Saved. Leave blank to keep it.'
                                                : undefined
                                        }
                                    >
                                        <Input
                                            id="semaphore_api_key"
                                            type="password"
                                            autoComplete="off"
                                            value={form.data.semaphore_api_key}
                                            onChange={(event) =>
                                                form.setData(
                                                    'semaphore_api_key',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder={
                                                settings.has_api_key
                                                    ? '••••••••••••'
                                                    : ''
                                            }
                                        />
                                    </FormField>
                                    <FormField
                                        id="sms_sender_name"
                                        label="Sender name"
                                        error={form.errors.sms_sender_name}
                                        hint="Up to 11 letters or numbers, approved in Semaphore. Required to switch texts on."
                                    >
                                        <Input
                                            id="sms_sender_name"
                                            maxLength={11}
                                            required={form.data.sms_enabled}
                                            value={form.data.sms_sender_name}
                                            onChange={(event) =>
                                                form.setData(
                                                    'sms_sender_name',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="ABQRENTAL"
                                        />
                                    </FormField>
                                </div>
                            </div>
                        }
                        test={
                            <FormField
                                id="sms_test_recipient"
                                label="Send a test text to"
                                error={form.errors.test_recipient}
                            >
                                <Input
                                    id="sms_test_recipient"
                                    inputMode="tel"
                                    value={form.data.test_recipient}
                                    onChange={(event) =>
                                        form.setData(
                                            'test_recipient',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="09171234567"
                                />
                            </FormField>
                        }
                        onSave={() =>
                            form.put(context.urls.sms_update!, {
                                preserveScroll: true,
                                onSuccess: () =>
                                    form.setData('semaphore_api_key', ''),
                            })
                        }
                        onTest={() =>
                            router.post(context.urls.sms_test!, form.data, {
                                preserveScroll: true,
                                onStart: () => setIsTesting(true),
                                onFinish: () => setIsTesting(false),
                            })
                        }
                        processing={form.processing}
                        isTesting={isTesting}
                        canDisconnect={settings.has_api_key}
                        disconnectUrl={context.urls.sms_update!}
                        disconnectLabel="Texts stop and your saved API key is removed."
                    />
                </>
            ) : (
                <ManagedNotice
                    context={context}
                    title={
                        !context.plan.sms
                            ? 'Texts are not on your plan'
                            : settings.has_api_key &&
                                settings.sms_enabled &&
                                settings.sms_sender_name
                              ? 'Texts are on'
                              : 'Texts are being set up'
                    }
                    isIncluded={context.plan.sms}
                    upgradeLabel="See plans with SMS"
                >
                    {context.plan.sms ? (
                        <p>
                            {settings.has_api_key &&
                            settings.sms_enabled &&
                            settings.sms_sender_name
                                ? `Booking texts and reminders go out as ${settings.sms_sender_name}. They use prepaid text credits (about ₱0.50 per text) that you load separately.`
                                : "Message Rentiva support from the Help page and we'll set up texts for your business and show you how to load credits."}
                        </p>
                    ) : (
                        <p>
                            Booking texts and SMS reminders to you and your
                            renters are on the Growth and Fleet plans. Emails
                            still go out on every plan.
                        </p>
                    )}
                </ManagedNotice>
            )}
        </div>
    );
}
