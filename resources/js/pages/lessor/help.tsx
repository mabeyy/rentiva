import { Head, Link } from '@inertiajs/react';
import { Clock, LifeBuoy, Mail, Phone, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/lessor/page-header';
import lessor from '@/routes/lessor';

function ContactRow({
    icon: Icon,
    label,
    value,
    href,
}: {
    icon: typeof Mail;
    label: string;
    value: string;
    href: string;
}) {
    return (
        <a
            href={href}
            className="flex items-center gap-3 rounded-2xl border bg-background p-4 transition-colors hover:border-foreground/30"
        >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Icon className="size-4" />
            </span>
            <span>
                <span className="block text-xs text-muted-foreground">
                    {label}
                </span>
                <span className="block font-medium">{value}</span>
            </span>
        </a>
    );
}

export default function LessorHelp({
    support,
    priority,
    responseHours,
}: {
    support: { email: string | null; phone: string | null };
    /** Set on plans with priority support. */
    priority: { phone: string | null; response_hours: number } | null;
    responseHours: number;
}) {
    return (
        <>
            <Head title="Help" />

            <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-8">
                <PageHeader
                    eyebrow="Support"
                    title="Help"
                    description="Questions, a setup you need help with, or something not working? Reach the Rentiva team here."
                />

                {priority && (
                    <section className="space-y-3 rounded-3xl border border-brand/40 bg-brand/5 p-5 sm:p-6">
                        <p className="flex items-center gap-2 text-sm font-semibold text-brand">
                            <Sparkles className="size-4" /> Priority support
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Your plan comes first in line. We reply within{' '}
                            <span className="font-medium text-foreground">
                                {priority.response_hours}{' '}
                                {priority.response_hours === 1
                                    ? 'hour'
                                    : 'hours'}
                            </span>{' '}
                            during business hours.
                        </p>
                        {priority.phone && (
                            <ContactRow
                                icon={Phone}
                                label="Priority line (call, text or Viber)"
                                value={priority.phone}
                                href={`tel:${priority.phone}`}
                            />
                        )}
                    </section>
                )}

                <section className="space-y-3">
                    <h2 className="text-sm font-semibold">Contact us</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {support.email && (
                            <ContactRow
                                icon={Mail}
                                label="Email"
                                value={support.email}
                                href={`mailto:${support.email}`}
                            />
                        )}
                        {support.phone && (
                            <ContactRow
                                icon={Phone}
                                label="Phone"
                                value={support.phone}
                                href={`tel:${support.phone}`}
                            />
                        )}
                    </div>
                    {!priority && (
                        <p className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Clock className="mt-0.5 size-4 shrink-0" />
                            <span>
                                We usually reply within one business day. Fleet
                                plans get a priority line with replies within{' '}
                                {responseHours} hours.{' '}
                                <Link
                                    href={lessor.billing.index()}
                                    className="font-medium text-foreground underline underline-offset-4"
                                >
                                    See plans
                                </Link>
                            </span>
                        </p>
                    )}
                </section>

                <section className="flex items-start gap-3 rounded-3xl border p-5 text-sm text-muted-foreground">
                    <LifeBuoy className="mt-0.5 size-4 shrink-0 text-brand" />
                    <p>
                        When you write, include your booking reference (like
                        RNT-ABC123) or the car's name so we can find it fast.
                    </p>
                </section>
            </div>
        </>
    );
}

LessorHelp.layout = {
    breadcrumbs: [{ title: 'Help', href: lessor.help() }],
};
