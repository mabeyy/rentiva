import { Form, Head, Link } from '@inertiajs/react';
import {
    Bug,
    CalendarDays,
    CarFront,
    Clock,
    CreditCard,
    Mail,
    MessageCircleQuestion,
    Phone,
    Send,
    Sparkles,
    Store,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import SupportRequestController from '@/actions/App/Http/Controllers/Lessor/SupportRequestController';
import { FormField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { FormSection } from '@/components/lessor/form-section';
import { PageHeader } from '@/components/lessor/page-header';
import { BrandButton } from '@/components/public/brand-button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';
import type { Option } from '@/types';
import { FilePicker } from '@/components/file-picker';

/** An icon for each help topic. */
const topicIcons: Record<string, LucideIcon> = {
    bookings: CalendarDays,
    cars: CarFront,
    booking_page: Store,
    billing: CreditCard,
    bug: Bug,
    other: MessageCircleQuestion,
};

/** A way to reach us, as a row in the side card's list. */
function ContactRow({
    icon: Icon,
    label,
    value,
    href,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    href: string;
}) {
    return (
        <a
            href={href}
            className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/60"
        >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Icon className="size-4" />
            </span>
            <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">
                    {label}
                </span>
                <span className="block truncate text-sm font-medium">
                    {value}
                </span>
            </span>
        </a>
    );
}

/**
 * Help: a form that emails Rentiva support (replies go to the sender), and
 * on the side the other ways to reach us and how fast we reply.
 */
export default function LessorHelp({
    support,
    priority,
    responseHours,
    topics,
    replyTo,
    messageLimits,
}: {
    support: { email: string | null; phone: string | null };
    /** Set on plans with priority support. */
    priority: { phone: string | null; response_hours: number } | null;
    responseHours: number;
    topics: Option[];
    /** The signed-in person's email, where replies go. */
    replyTo: string;
    messageLimits: { min: number; max: number };
}) {
    const [topic, setTopic] = useState<string | null>(null);
    const [messageLength, setMessageLength] = useState(0);

    return (
        <>
            <Head title="Help" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <PageHeader
                    title="Help"
                    description="A question, a setup you need help with, or something not working? Send us a message and we'll get back to you."
                />

                <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <FormSection
                        title="Send us a message"
                        description="Pick a topic and tell us what's going on. The more detail, the faster we can help."
                    >
                        <Form
                            {...SupportRequestController.form()}
                            options={{ preserveScroll: true }}
                            resetOnSuccess
                            onSuccess={() => {
                                setTopic(null);
                                setMessageLength(0);
                            }}
                            className="space-y-5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <fieldset className="space-y-2">
                                        <legend className="mb-2 text-sm font-medium">
                                            What's it about?
                                        </legend>
                                        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                                            {topics.map((option) => {
                                                const Icon =
                                                    topicIcons[option.value] ??
                                                    MessageCircleQuestion;
                                                const isChosen =
                                                    topic === option.value;

                                                return (
                                                    <label
                                                        key={option.value}
                                                        className={cn(
                                                            'flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors hover:border-foreground/30 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50',
                                                            isChosen &&
                                                                'border-brand bg-brand/5 font-medium hover:border-brand',
                                                        )}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="topic"
                                                            value={option.value}
                                                            checked={isChosen}
                                                            onChange={() =>
                                                                setTopic(
                                                                    option.value,
                                                                )
                                                            }
                                                            className="sr-only"
                                                            required
                                                        />
                                                        <Icon
                                                            className={cn(
                                                                'size-4 shrink-0 text-muted-foreground',
                                                                isChosen &&
                                                                    'text-brand',
                                                            )}
                                                        />
                                                        {option.label}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <InputError message={errors.topic} />
                                    </fieldset>

                                    <FormField
                                        id="message"
                                        label="Your message"
                                        error={errors.message}
                                    >
                                        <Textarea
                                            id="message"
                                            name="message"
                                            rows={7}
                                            onChange={(event) =>
                                                setMessageLength(
                                                    event.target.value.trim()
                                                        .length,
                                                )
                                            }
                                            minLength={messageLimits.min}
                                            maxLength={messageLimits.max}
                                            placeholder="What happened, what you expected, and anything you already tried."
                                            required
                                        />
                                        <p className="flex justify-between gap-3 text-xs text-muted-foreground tabular-nums">
                                            <span>
                                                {messageLength <
                                                messageLimits.min
                                                    ? `${messageLimits.min - messageLength} more ${messageLimits.min - messageLength === 1 ? 'character' : 'characters'} needed`
                                                    : ''}
                                            </span>
                                            <span>
                                                {messageLength} /{' '}
                                                {messageLimits.max}
                                            </span>
                                        </p>
                                    </FormField>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <FormField
                                            id="reference"
                                            label="Booking or car (optional)"
                                            hint="So we can find it fast."
                                            error={errors.reference}
                                        >
                                            <Input
                                                id="reference"
                                                name="reference"
                                                maxLength={60}
                                                placeholder="e.g. RNT-ABC123 or 2024 Toyota Vios"
                                            />
                                        </FormField>
                                        <FormField
                                            id="screenshot"
                                            label="Screenshot (optional)"
                                            hint="JPG, PNG or WebP, up to 5 MB."
                                            error={errors.screenshot}
                                        >
                                            <FilePicker
                                                id="screenshot"
                                                name="screenshot"
                                                placeholder="Add a screenshot"
                                            />
                                        </FormField>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
                                        <p className="text-xs text-muted-foreground">
                                            Replies go to{' '}
                                            <span className="font-medium text-foreground">
                                                {replyTo}
                                            </span>
                                        </p>
                                        <BrandButton
                                            type="submit"
                                            className="rounded-full px-6"
                                            disabled={
                                                processing ||
                                                messageLength <
                                                    messageLimits.min
                                            }
                                        >
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <Send />
                                            )}
                                            Send message
                                        </BrandButton>
                                    </div>
                                </>
                            )}
                        </Form>
                    </FormSection>

                    <aside className="rounded-3xl border bg-background p-5">
                        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Reply time
                        </p>
                        <p className="mt-1 flex items-center gap-2 font-display text-xl font-bold">
                            <Clock className="size-5 text-brand" />
                            {priority
                                ? `Within ${priority.response_hours} ${priority.response_hours === 1 ? 'hour' : 'hours'}`
                                : 'Within 1 business day'}
                        </p>
                        {priority ? (
                            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
                                <Sparkles className="size-3.5" /> Priority
                                support on your plan
                            </p>
                        ) : (
                            <p className="mt-1 text-xs text-muted-foreground">
                                Fleet plans get replies within {responseHours}{' '}
                                hours and a priority line.{' '}
                                <Link
                                    href={lessor.billing.index()}
                                    className="font-medium text-foreground underline underline-offset-4"
                                >
                                    See plans
                                </Link>
                            </p>
                        )}

                        {(support.email ||
                            support.phone ||
                            priority?.phone) && (
                            <div className="mt-5 border-t pt-4">
                                <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    Reach us directly
                                </p>
                                {priority?.phone && (
                                    <ContactRow
                                        icon={Phone}
                                        label="Priority line · call, text or Viber"
                                        value={priority.phone}
                                        href={`tel:${priority.phone}`}
                                    />
                                )}
                                {support.email && (
                                    <ContactRow
                                        icon={Mail}
                                        label="Email"
                                        value={support.email}
                                        href={`mailto:${support.email}`}
                                    />
                                )}
                                {support.phone &&
                                    support.phone !== priority?.phone && (
                                        <ContactRow
                                            icon={Phone}
                                            label="Phone"
                                            value={support.phone}
                                            href={`tel:${support.phone}`}
                                        />
                                    )}
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </>
    );
}

LessorHelp.layout = {
    breadcrumbs: [{ title: 'Help', href: lessor.help() }],
};
