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

export type EmailSettings = {
    has_api_key: boolean;
    mail_from_address: string | null;
    test_recipient: string;
    reminders: ReminderSettings;
};

const setupSteps: ReactNode[] = [
    <>
        Create a free account at{' '}
        <StepLink href="https://resend.com/signup">resend.com</StepLink>.
    </>,
    <>
        Go to <strong className="text-foreground">Domains</strong>, add your
        business domain (for example yourbusiness.ph), and add the DNS records
        Resend shows you at your domain provider. Wait until it says{' '}
        <strong className="text-foreground">Verified</strong>.
    </>,
    <>
        Go to <strong className="text-foreground">API Keys</strong>, create a
        key with <strong className="text-foreground">Sending access</strong>,
        and copy it. It starts with re_ and is only shown once.
    </>,
    'Paste the key below and enter the address to send from. It must be on your verified domain, such as bookings@yourbusiness.ph.',
    'Send a test to your own inbox, then save. From then on, renter emails come from your address.',
];

/**
 * The email part of the Notifications page: pickup reminders, and
 * for admins the setup steps and connection form.
 */
export function EmailSection({
    settings,
    context,
}: {
    settings: EmailSettings;
    context: ConnectionContext;
}) {
    const [isTesting, setIsTesting] = useState(false);
    const form = useForm({
        resend_api_key: '',
        mail_from_address: settings?.mail_from_address ?? '',
        test_recipient: settings?.test_recipient ?? '',
    });

    return (
        <div className="space-y-4">
            <PickupReminders
                channel="email"
                reminders={settings.reminders}
                updateUrl={context.urls.reminders}
                policiesUrl={context.urls.policies}
                note={
                    context.plan.email
                        ? undefined
                        : 'Email reminders need the Growth or Fleet plan.'
                }
            />
            {context.canEdit ? (
                <>
                    {!context.plan.branded_email && (
                        <PlanWarning
                            context={context}
                            feature="Emails from their own address"
                        />
                    )}
                    <SetupSteps steps={setupSteps} collapsible />
                    <ConnectionForm
                        title="Resend"
                        description="Create a free account at resend.com, verify your domain, then paste an API key here."
                        status={
                            <ConnectionStatus
                                connected={settings.has_api_key}
                            />
                        }
                        fields={
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    id="resend_api_key"
                                    label="API key"
                                    error={form.errors.resend_api_key}
                                    hint={
                                        settings.has_api_key
                                            ? 'Saved. Leave blank to keep it.'
                                            : 'Starts with re_'
                                    }
                                >
                                    <Input
                                        id="resend_api_key"
                                        type="password"
                                        autoComplete="off"
                                        value={form.data.resend_api_key}
                                        onChange={(event) =>
                                            form.setData(
                                                'resend_api_key',
                                                event.target.value,
                                            )
                                        }
                                        placeholder={
                                            settings.has_api_key
                                                ? '••••••••••••'
                                                : 're_…'
                                        }
                                    />
                                </FormField>
                                <FormField
                                    id="mail_from_address"
                                    label="Send from"
                                    error={form.errors.mail_from_address}
                                    hint="An address on your verified domain."
                                >
                                    <Input
                                        id="mail_from_address"
                                        type="email"
                                        value={form.data.mail_from_address}
                                        onChange={(event) =>
                                            form.setData(
                                                'mail_from_address',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="bookings@yourbusiness.ph"
                                    />
                                </FormField>
                            </div>
                        }
                        test={
                            <FormField
                                id="test_recipient"
                                label="Send a test email to"
                                error={form.errors.test_recipient}
                            >
                                <Input
                                    id="test_recipient"
                                    type="email"
                                    value={form.data.test_recipient}
                                    onChange={(event) =>
                                        form.setData(
                                            'test_recipient',
                                            event.target.value,
                                        )
                                    }
                                />
                            </FormField>
                        }
                        onSave={() =>
                            form.put(context.urls.email_update!, {
                                preserveScroll: true,
                                onSuccess: () =>
                                    form.setData('resend_api_key', ''),
                            })
                        }
                        onTest={() =>
                            router.post(context.urls.email_test!, form.data, {
                                preserveScroll: true,
                                onStart: () => setIsTesting(true),
                                onFinish: () => setIsTesting(false),
                            })
                        }
                        processing={form.processing}
                        isTesting={isTesting}
                        canDisconnect={settings.has_api_key}
                        disconnectUrl={context.urls.email_update!}
                        disconnectLabel="Renter emails will go out from Rentiva again."
                    />
                </>
            ) : (
                <ManagedNotice
                    context={context}
                    title={
                        !context.plan.email
                            ? 'Booking emails are not on your plan'
                            : context.plan.branded_email &&
                                settings.has_api_key &&
                                settings.mail_from_address
                              ? `Emails come from ${settings.mail_from_address}`
                              : 'Emails come from Rentiva'
                    }
                    isIncluded={context.plan.email}
                    upgradeLabel="See plans with booking emails"
                >
                    {context.plan.email ? (
                        <>
                            <p>
                                Booking emails to you and your renters are on.
                                Rentiva sets up and looks after email for you.
                            </p>
                            <p>
                                {context.plan.branded_email
                                    ? "Want them sent from your own address, like bookings@yourbusiness.ph? Contact Rentiva support and we'll set it up."
                                    : 'Sending from your own address, like bookings@yourbusiness.ph, is on the Fleet plan.'}
                            </p>
                        </>
                    ) : (
                        <p>
                            Confirmations, payment instructions and reminders by
                            email are on the Growth and Fleet plans. You still
                            see every booking in your dashboard and
                            notifications.
                        </p>
                    )}
                </ManagedNotice>
            )}
        </div>
    );
}
