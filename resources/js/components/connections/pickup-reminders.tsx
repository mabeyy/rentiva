import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';

export type ReminderSettings = {
    remind_24h: boolean;
    remind_2h: boolean;
    /** "HH:MM", Philippine time. */
    pickup_time: string;
};

/** "HH:MM" shifted back by whole hours, e.g. ("09:00", 2) → "07:00". */
function hoursBefore(time: string, hours: number): string {
    const [hour, minute] = time.split(':').map(Number);

    return `${(hour - hours + 24) % 24}:${String(minute).padStart(2, '0')}`;
}

/** e.g. "9:00 AM". */
function clockTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);

    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
}

/**
 * The 24-hour and 2-hour pickup reminder switches for one channel, with the
 * time each one goes out. Each switch saves on its own, separately from the
 * connection form.
 */
export function PickupReminders({
    channel,
    reminders,
    updateUrl,
    policiesUrl,
    note,
}: {
    channel: 'email' | 'sms';
    reminders: ReminderSettings;
    updateUrl: string;
    policiesUrl: string | null;
    /** Extra condition shown under the switches, e.g. needing SMS switched on. */
    note?: string;
}) {
    const [saving, setSaving] = useState<string | null>(null);
    const pickupTime = clockTime(reminders.pickup_time);
    const options = [
        {
            key: 'remind_24h' as const,
            time: `Day before, ${pickupTime}`,
            label: '24h before',
        },
        {
            key: 'remind_2h' as const,
            time: `Same day, ${clockTime(hoursBefore(reminders.pickup_time, 2))}`,
            label: '2h before',
        },
    ];

    function toggle(key: 'remind_24h' | 'remind_2h', checked: boolean): void {
        const field = `remind_${channel}_${key.replace('remind_', '')}`;

        router.put(
            updateUrl,
            { [field]: checked },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setSaving(key),
                onFinish: () => setSaving(null),
            },
        );
    }

    return (
        <section className="flex flex-col gap-4 rounded-3xl border bg-background p-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
                <h2 className="font-display text-base font-bold tracking-tight">
                    Pickup reminders
                </h2>
                <p className="text-sm text-muted-foreground">
                    {note && <>{note} </>}
                    For your {pickupTime} pickup
                    {policiesUrl && (
                        <>
                            {' · '}
                            <Link
                                href={policiesUrl}
                                className="font-medium text-foreground underline-offset-4 hover:underline"
                            >
                                Change
                            </Link>
                        </>
                    )}
                </p>
            </div>

            <div className="flex divide-x rounded-2xl border sm:border-0">
                {options.map((option) => (
                    <label
                        key={option.key}
                        className="flex flex-1 cursor-pointer items-center justify-between gap-4 px-4 py-2.5 sm:flex-none sm:py-1 sm:last:pr-0"
                    >
                        <span className="leading-tight">
                            <span className="block text-sm font-medium">
                                {option.label}
                            </span>
                            <span className="block text-xs text-muted-foreground tabular-nums">
                                {option.time}
                            </span>
                        </span>
                        <Switch
                            checked={reminders[option.key]}
                            disabled={saving === option.key}
                            onCheckedChange={(checked) =>
                                toggle(option.key, checked)
                            }
                            className="data-[state=checked]:bg-brand"
                        />
                    </label>
                ))}
            </div>
        </section>
    );
}
