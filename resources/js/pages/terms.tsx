import { Link, usePage } from '@inertiajs/react';
import {
    LegalList,
    LegalPage,
    LegalSection,
} from '@/components/legal/legal-page';
import { privacy } from '@/routes';

/**
 * Rentiva's terms: what renters agree to when they book through an owner's
 * page, and what rental businesses agree to when they subscribe.
 */
export default function Terms({
    lastUpdated,
    contactEmail,
    daysToPay,
    graceDays,
}: {
    lastUpdated: string;
    contactEmail: string;
    daysToPay: number;
    graceDays: number;
}) {
    const { name } = usePage().props;
    const email = (
        <a
            href={`mailto:${contactEmail}`}
            className="font-medium text-foreground underline underline-offset-4"
        >
            {contactEmail}
        </a>
    );

    return (
        <LegalPage
            title="Terms of service"
            intro={`The rules for using ${name}: for renters booking a vehicle, and for the rental businesses that list their vehicles here.`}
            lastUpdated={lastUpdated}
        >
            <LegalSection heading="What Rentiva is">
                <p>
                    {name} gives rental businesses (“owners”) a booking page
                    where renters can request their vehicles. Each rental is an
                    agreement between the renter and that owner. {name} is not a
                    party to it, doesn't own or inspect the vehicles, and
                    doesn't handle the rental payment.
                </p>
            </LegalSection>

            <LegalSection heading="For renters">
                <LegalList
                    items={[
                        'Give your real name, mobile number and email, and a valid driver’s license. The owner may ask to see the license, or a photo of it, before confirming.',
                        'A request isn’t a booking until the owner confirms it.',
                        'You pay the owner directly, at pickup or by bank transfer, as shown on the booking. If a transfer isn’t received by the deadline, the owner’s booking can be cancelled and the dates released.',
                        'Cancellations, refunds, deposits and extra charges (such as late return, fuel or damage) follow the owner’s own policy, shown when you book.',
                        'Return the vehicle on time and in the same condition. You’re responsible to the owner for traffic violations, tolls, fuel and damage during the rental, as agreed with them.',
                        'Reviews must be honest and about your own rental. We may remove reviews that are abusive or not genuine.',
                    ]}
                />
            </LegalSection>

            <LegalSection heading="For rental businesses">
                <LegalList
                    items={[
                        'You must be allowed to rent out every vehicle you list, and keep its registration, insurance and any required permits valid.',
                        'Your listings, prices and policies must be accurate. You’re responsible for your vehicles, your agreements with renters, and collecting and refunding payments.',
                        'Handle renters’ personal information only to run their rentals, as described in your privacy notice and the Data Privacy Act. Don’t share it or use it for anything else.',
                        `Plans are paid monthly or yearly by bank transfer. Each invoice is due ${daysToPay} days after it’s issued. If an invoice is more than ${graceDays} days overdue, your booking page stops taking online bookings until it’s paid; your account and data stay.`,
                        'Rentiva takes no commission on your bookings. Plan prices can change; a new price applies from your next invoice, and we’ll tell you before it does.',
                        'Texts are sent through your own Semaphore account, and you pay Semaphore for them.',
                        'You can stop anytime. Paid periods aren’t refunded, but your page keeps working until the period ends.',
                    ]}
                />
            </LegalSection>

            <LegalSection heading="What isn’t allowed">
                <LegalList
                    items={[
                        'Listing vehicles you can’t legally rent out, or false information.',
                        'Using the service for fraud, harassment, or anything illegal.',
                        'Trying to get into other people’s accounts or data, or disrupting the service.',
                    ]}
                />
                <p>
                    We may suspend accounts or remove listings that break these
                    rules.
                </p>
            </LegalSection>

            <LegalSection heading="Liability">
                <p>
                    {name} is provided as is. We work to keep it running and
                    secure, but we aren’t responsible for disputes between
                    renters and owners, the condition of vehicles, or losses
                    from a rental. As far as the law allows, our liability to an
                    owner is limited to the plan fees they paid us in the last
                    three months.
                </p>
            </LegalSection>

            <LegalSection heading="Your data">
                <p>
                    How we handle personal information is explained in our{' '}
                    <Link
                        href={privacy()}
                        className="font-medium text-foreground underline underline-offset-4"
                    >
                        privacy notice
                    </Link>
                    .
                </p>
            </LegalSection>

            <LegalSection heading="Changes and contact">
                <p>
                    We may update these terms; the date at the top shows the
                    latest version, and we’ll tell owners about important
                    changes. These terms are governed by the laws of the
                    Philippines. Questions? Write to {email}.
                </p>
            </LegalSection>
        </LegalPage>
    );
}
