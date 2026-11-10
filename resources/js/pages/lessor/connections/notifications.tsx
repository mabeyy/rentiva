import { Mail, MessageSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ConnectionContext } from '@/components/connections/connections-shell';
import {
    ConnectionsShell,
    NeedsBookingPage,
} from '@/components/connections/connections-shell';
import type { EmailSettings } from '@/components/connections/email-section';
import { EmailSection } from '@/components/connections/email-section';
import type { SmsSettings } from '@/components/connections/sms-section';
import { SmsSection } from '@/components/connections/sms-section';

/** A titled part of the page: Email or Texts. */
function ChannelSection({
    id,
    icon: Icon,
    title,
    children,
}: {
    id: string;
    icon: LucideIcon;
    title: string;
    children: ReactNode;
}) {
    return (
        <section id={id} className="scroll-mt-6 space-y-4">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
                <span className="flex size-8 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Icon className="size-4" />
                </span>
                {title}
            </h2>
            {children}
        </section>
    );
}

/**
 * How the owner and their renters hear about bookings: emails and texts,
 * each with its pickup reminders. Admins also set up both here.
 */
export default function ConnectionNotifications({
    email,
    sms,
    ...context
}: ConnectionContext & {
    email: EmailSettings | null;
    sms: SmsSettings | null;
}) {
    return (
        <ConnectionsShell
            context={context}
            description={
                context.canEdit
                    ? "Set up this business's booking emails and texts, and the pickup reminders each sends."
                    : 'How you and your renters hear about bookings, by email and text, and the pickup reminders each sends.'
            }
        >
            {email && sms ? (
                <div className="space-y-10">
                    <ChannelSection id="email" icon={Mail} title="Email">
                        <EmailSection settings={email} context={context} />
                    </ChannelSection>
                    <ChannelSection id="sms" icon={MessageSquare} title="Texts">
                        <SmsSection settings={sms} context={context} />
                    </ChannelSection>
                </div>
            ) : (
                <NeedsBookingPage />
            )}
        </ConnectionsShell>
    );
}
