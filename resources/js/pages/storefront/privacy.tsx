import { usePage } from '@inertiajs/react';
import type { DataProtection } from '@/components/legal/legal-page';
import {
    LegalList,
    LegalPage,
    LegalSection,
    breachPromise,
    dataPrivacyRights,
    describeMonths,
    serviceProviders,
} from '@/components/legal/legal-page';
import type { Storefront } from '@/types';

type PrivacyDetails = {
    ownerEmail: string;
    address: string | null;
    retentionMonths: number;
    acceptsBankTransfer: boolean;
    proofRetentionDays: number;
    platformEmail: string;
};

/**
 * An owner's privacy notice for renters, in their branding, with the retention
 * periods they chose on their Policies page.
 */
export default function StorefrontPrivacy({
    lastUpdated,
    privacy,
    dataProtection,
}: {
    lastUpdated: string;
    privacy: PrivacyDetails;
    dataProtection: DataProtection;
}) {
    const { storefront, name: platformName } = usePage<{
        storefront: Storefront;
    }>().props;
    const owner = storefront.name;
    const email = (
        <a
            href={`mailto:${privacy.ownerEmail}`}
            className="font-medium text-foreground underline underline-offset-4"
        >
            {privacy.ownerEmail}
        </a>
    );

    return (
        <LegalPage
            title="Privacy notice"
            intro={`How ${owner} collects, uses and protects your personal information when you book a vehicle.`}
            lastUpdated={lastUpdated}
        >
            <LegalSection heading="Who is responsible for your data">
                <p>
                    {owner}
                    {privacy.address && `, at ${privacy.address},`} is the
                    personal information controller for the details you give
                    when you book. You can reach them at {email}
                    {storefront.phone && ` or ${storefront.phone}`}.
                </p>
                <p>
                    {owner} uses {platformName} to run this booking page.{' '}
                    {platformName} stores and processes your booking on {owner}
                    's behalf and only as instructed by them. {platformName}'s
                    Data Protection Officer can be reached at{' '}
                    <a
                        href={`mailto:${dataProtection.dpoEmail}`}
                        className="font-medium text-foreground underline underline-offset-4"
                    >
                        {dataProtection.dpoEmail}
                    </a>
                    .
                </p>
                <p>
                    This notice is provided under the Data Privacy Act of 2012
                    (Republic Act No. 10173) and its implementing rules.
                </p>
            </LegalSection>

            <LegalSection heading="What is collected">
                <LegalList
                    items={[
                        'Your name, email address and mobile number.',
                        "Your driver's license number, so the owner can check it at pickup.",
                        'The booking itself: the vehicle, pickup and return dates, and the total due.',
                        'Any note you add to your request.',
                        ...(privacy.acceptsBankTransfer
                            ? [
                                  'If you pay by bank transfer: the reference number and the screenshot of your transfer.',
                              ]
                            : []),
                        'Basic technical information your browser sends, such as your IP address, used to keep the booking form from being abused.',
                    ]}
                />
            </LegalSection>

            <LegalSection heading="Why it is used">
                <LegalList
                    items={[
                        'To receive, confirm and manage your booking. This is necessary to carry out the rental you asked for.',
                        'To email you about your booking: confirmations, changes and payment updates.',
                        'To let you view, pay for or cancel your booking through the private link you are sent.',
                        'To check your identity and license when you collect the vehicle.',
                        'To keep the booking form safe from spam and fraud.',
                        `To let ${owner} keep a private note on a renter it had a problem with, such as an unpaid rental or damage. Only the business sees it, and it's removed after the same period as bookings.`,
                    ]}
                />
                <p>
                    Your information is not sold, and it is not used for
                    advertising.
                </p>
            </LegalSection>

            <LegalSection heading="Who else sees it">
                <LegalList
                    items={[
                        `Staff ${owner} gives access to their bookings.`,
                        `${platformName}, which hosts this booking page and stores your booking for ${owner}, and the services it uses:`,
                        ...serviceProviders.map((provider) => `– ${provider}`),
                        'Authorities, where the law requires it, or to establish or defend a legal claim.',
                    ]}
                />
                <p>
                    Your contact details are never shown publicly. If you leave
                    a review, your star rating and comment appear on the
                    business's page with your first name and last initial (like
                    "Juan D."), and count toward its public rating.
                </p>
            </LegalSection>

            <LegalSection heading="How long it is kept">
                <p>
                    {owner} keeps the personal details on a booking for{' '}
                    <strong className="text-foreground">
                        {describeMonths(privacy.retentionMonths)}
                    </strong>{' '}
                    after your trip ends. After that, an automated nightly
                    process permanently removes your name, email address, mobile
                    number, license number, license photo, delivery address,
                    notes and messages about the booking, and photos from the
                    pickup and return checks. Records of the emails and texts
                    sent to you are deleted after 90 days.
                </p>
                {privacy.acceptsBankTransfer && (
                    <p>
                        Transfer screenshots are deleted sooner:{' '}
                        <strong className="text-foreground">
                            {privacy.proofRetentionDays}{' '}
                            {privacy.proofRetentionDays === 1 ? 'day' : 'days'}
                        </strong>{' '}
                        after your trip, once the owner has checked the payment,
                        or after a booking is cancelled.
                    </p>
                )}
                <p>
                    The booking record itself (the vehicle, dates and amount) is
                    kept without your personal details, so the business can
                    still account for past rentals.
                </p>
            </LegalSection>

            <LegalSection heading="Your rights">
                <p>Under the Data Privacy Act you have the right to:</p>
                <LegalList items={dataPrivacyRights} />
                <p>
                    To exercise any of these, email {email} from the address on
                    your booking. Some records may need to be kept to complete a
                    booking you've already made, or to meet tax and accounting
                    requirements. If you believe your rights have been violated,
                    you may complain to the National Privacy Commission
                    (privacy.gov.ph).
                </p>
            </LegalSection>

            <LegalSection heading="How it is protected">
                <p>
                    Bookings are stored on managed infrastructure and served
                    over an encrypted connection. Only {owner} and the staff
                    they give access to can see your booking; {platformName}'s
                    team looks at it only to give support or when the law
                    requires it. The link to manage your booking contains a long
                    random signature, and license photos and transfer
                    screenshots are stored privately.
                </p>
                <p>{breachPromise}</p>
            </LegalSection>

            <LegalSection heading="Changes to this notice">
                <p>
                    If how your information is handled changes, this page and
                    the date above will be updated.
                </p>
            </LegalSection>
        </LegalPage>
    );
}
