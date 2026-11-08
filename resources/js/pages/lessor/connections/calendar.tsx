import { router, useForm } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import type { ConnectionContext } from '@/components/connections/connections-shell';
import {
    ConnectionsShell,
    ManagedNotice,
    PlanWarning,
    ConnectionStatus,
    NeedsBookingPage,
} from '@/components/connections/connections-shell';
import { ConnectionForm } from '@/components/connections/connection-form';
import { SetupSteps, StepLink } from '@/components/connections/setup-steps';
import { FormField } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

type CalendarSettings = {
    google_calendar_id: string | null;
    google_client_email: string | null;
    has_private_key: boolean;
    google_calendar_enabled: boolean;
};

const setupSteps: ReactNode[] = [
    <>
        In{' '}
        <StepLink href="https://console.cloud.google.com/">
            Google Cloud Console
        </StepLink>
        , create a project, enable the Google Calendar API, and create a service
        account.
    </>,
    'Add a key to the service account (JSON). Copy its client_email and private_key below.',
    'In Google Calendar, open your calendar\'s settings, share it with the service account email, and allow "Make changes to events".',
    'Copy the Calendar ID from "Integrate calendar" and paste it below.',
];

export default function ConnectionCalendar({
    settings,
    ...context
}: ConnectionContext & { settings: CalendarSettings | null }) {
    const [isTesting, setIsTesting] = useState(false);
    const form = useForm({
        google_calendar_id: settings?.google_calendar_id ?? '',
        google_client_email: settings?.google_client_email ?? '',
        google_private_key: '',
        google_calendar_enabled: settings?.google_calendar_enabled ?? false,
    });

    return (
        <ConnectionsShell
            context={context}
            description="See confirmed bookings on your own Google Calendar. Each rental appears as an all-day event from pickup to return, and is removed if it's cancelled."
        >
            {settings ? (
                <>
                    {context.canEdit ? (
                        <>
                            {!context.plan.calendar_sync && (
                                <PlanWarning
                                    context={context}
                                    feature="Google Calendar sync"
                                />
                            )}
                            <SetupSteps steps={setupSteps} />

                            <ConnectionForm
                                title="Google Calendar"
                                description="Connected through a Google service account you share your calendar with."
                                status={
                                    <ConnectionStatus
                                        connected={
                                            settings.has_private_key &&
                                            settings.google_calendar_enabled
                                        }
                                    />
                                }
                                fields={
                                    <div className="space-y-4">
                                        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4">
                                            <span className="font-medium">
                                                Add bookings to my calendar
                                            </span>
                                            <Switch
                                                checked={
                                                    form.data
                                                        .google_calendar_enabled
                                                }
                                                onCheckedChange={(checked) =>
                                                    form.setData(
                                                        'google_calendar_enabled',
                                                        checked,
                                                    )
                                                }
                                                className="data-[state=checked]:bg-brand"
                                            />
                                        </label>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <FormField
                                                id="google_calendar_id"
                                                label="Calendar ID"
                                                error={
                                                    form.errors
                                                        .google_calendar_id
                                                }
                                            >
                                                <Input
                                                    id="google_calendar_id"
                                                    value={
                                                        form.data
                                                            .google_calendar_id
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'google_calendar_id',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="abc123@group.calendar.google.com"
                                                />
                                            </FormField>
                                            <FormField
                                                id="google_client_email"
                                                label="Service account email"
                                                error={
                                                    form.errors
                                                        .google_client_email
                                                }
                                            >
                                                <Input
                                                    id="google_client_email"
                                                    type="email"
                                                    value={
                                                        form.data
                                                            .google_client_email
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'google_client_email',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="rentiva@project.iam.gserviceaccount.com"
                                                />
                                            </FormField>
                                        </div>
                                        <FormField
                                            id="google_private_key"
                                            label="Private key"
                                            error={
                                                form.errors.google_private_key
                                            }
                                            hint={
                                                settings.has_private_key
                                                    ? 'Saved. Leave blank to keep it.'
                                                    : 'The whole key, from -----BEGIN PRIVATE KEY----- to the end.'
                                            }
                                        >
                                            <Textarea
                                                id="google_private_key"
                                                rows={4}
                                                autoComplete="off"
                                                spellCheck={false}
                                                value={
                                                    form.data.google_private_key
                                                }
                                                onChange={(event) =>
                                                    form.setData(
                                                        'google_private_key',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder={
                                                    settings.has_private_key
                                                        ? '•••••••••••• (saved)'
                                                        : '-----BEGIN PRIVATE KEY-----'
                                                }
                                                className="font-mono text-xs"
                                            />
                                        </FormField>
                                    </div>
                                }
                                test={
                                    <p className="text-sm text-muted-foreground">
                                        Signs in with these details and reads
                                        your calendar, without creating
                                        anything.
                                    </p>
                                }
                                onSave={() =>
                                    form.put(context.urls.update!, {
                                        preserveScroll: true,
                                        onSuccess: () =>
                                            form.setData(
                                                'google_private_key',
                                                '',
                                            ),
                                    })
                                }
                                onTest={() =>
                                    router.post(context.urls.test!, form.data, {
                                        preserveScroll: true,
                                        onStart: () => setIsTesting(true),
                                        onFinish: () => setIsTesting(false),
                                    })
                                }
                                processing={form.processing}
                                isTesting={isTesting}
                                canDisconnect={settings.has_private_key}
                                disconnectUrl={context.urls.update!}
                                disconnectLabel="New bookings stop appearing on your calendar and the saved key is removed."
                            />
                        </>
                    ) : (
                        <ManagedNotice
                            context={context}
                            title="Google Calendar sync is not on your plan"
                            isIncluded={false}
                            upgradeLabel="See plans with calendar sync"
                        >
                            <p>
                                Copy every confirmed booking to your own Google
                                Calendar, and have it removed when cancelled.
                                It's on the Growth and Fleet plans.
                            </p>
                        </ManagedNotice>
                    )}
                </>
            ) : (
                <NeedsBookingPage />
            )}
        </ConnectionsShell>
    );
}
