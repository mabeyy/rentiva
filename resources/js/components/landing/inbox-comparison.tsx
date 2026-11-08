import { ArrowRight, CalendarDays, Phone, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const inbox = [
    { from: 'Mika R.', text: 'HM po RAV4 3 days?', mine: false },
    { from: 'Paolo S.', text: 'Available pa po ba sa Nov 14?', mine: false },
    { from: 'Mika R.', text: 'Hello po? 🙏', mine: false },
    { from: 'You', text: 'Sorry po, na-book na pala yung RAV4', mine: true },
    { from: 'Jen A.', text: 'Pa-reserve po ako this weekend', mine: false },
];

function Panel({
    label,
    children,
    className,
}: {
    label: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'rounded-3xl border bg-background p-5 sm:p-6',
                className,
            )}
        >
            <p className="mb-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                {label}
            </p>
            {children}
        </div>
    );
}

/**
 * The pain owners know (Messenger back-and-forth) next to the booking request they get instead.
 */
export function InboxComparison() {
    return (
        <section className="bg-paper">
            <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
                <h2 className="max-w-3xl font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
                    From <span className="text-muted-foreground">“HM po?”</span>{' '}
                    to a confirmed trip.
                </h2>
                <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                    No more answering the same three questions all day, or
                    double-booking a car because two chats said yes.
                </p>

                <div className="mt-12 grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
                    <Panel label="Your inbox today" className="opacity-90">
                        <div
                            className="space-y-2.5"
                            aria-label="Example Messenger conversation"
                        >
                            {inbox.map((message, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        'flex flex-col',
                                        message.mine
                                            ? 'items-end'
                                            : 'items-start',
                                    )}
                                >
                                    {!message.mine && (
                                        <span className="mb-0.5 px-3 text-[11px] text-muted-foreground">
                                            {message.from}
                                        </span>
                                    )}
                                    <span
                                        className={cn(
                                            'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm',
                                            message.mine
                                                ? 'rounded-br-md bg-sky-500 text-white'
                                                : 'rounded-bl-md bg-muted',
                                        )}
                                    >
                                        {message.text}
                                    </span>
                                </div>
                            ))}
                            <p className="pt-2 text-center text-xs text-muted-foreground">
                                + 23 unread conversations
                            </p>
                        </div>
                    </Panel>

                    <ArrowRight
                        aria-hidden
                        className="mx-auto size-8 rotate-90 text-brand lg:rotate-0"
                    />

                    <Panel
                        label="With your booking page"
                        className="border-brand/40 shadow-[0_24px_60px_-30px_var(--brand)]"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="font-mono text-xs text-muted-foreground">
                                    RNT-7KQ2XM
                                </p>
                                <p className="mt-1 font-display text-2xl font-bold">
                                    Juan Dela Cruz
                                </p>
                            </div>
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Pending
                            </span>
                        </div>
                        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <dt className="text-muted-foreground">Car</dt>
                                <dd className="font-medium">
                                    2025 Toyota RAV4
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Dates</dt>
                                <dd className="flex items-center gap-1 font-medium">
                                    <CalendarDays className="size-4" /> Nov 14 –
                                    17
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">
                                    Contact
                                </dt>
                                <dd className="flex items-center gap-1 font-medium">
                                    <Phone className="size-4" /> 0917 123 4567
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">
                                    Total at pickup
                                </dt>
                                <dd className="font-display text-lg font-bold">
                                    ₱10,500
                                </dd>
                            </div>
                        </dl>
                        <div className="mt-5 grid grid-cols-2 gap-2 text-sm font-semibold">
                            <span className="rounded-xl bg-brand py-2.5 text-center text-brand-foreground">
                                Confirm
                            </span>
                            <span className="rounded-xl border py-2.5 text-center">
                                Decline
                            </span>
                        </div>
                        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <ShieldCheck className="size-4 text-brand" /> Dates,
                            license number and contact details, all in one
                            request.
                        </p>
                    </Panel>
                </div>
            </div>
        </section>
    );
}
