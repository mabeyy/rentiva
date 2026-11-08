import { usePage } from '@inertiajs/react';
import {
    LegalList,
    LegalPage,
    LegalSection,
    dataPrivacyRights,
    describeMonths,
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
}: {
    lastUpdated: string;
    privacy: PrivacyDetails;
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
                    's behalf and only as instructed by them.
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
                        `${platformName}, which hosts this booking page and stores your booking for ${owner}.`,
                        'The email provider that delivers booking emails.',
                        'Authorities, where the law requires it, or to establish or defend a legal claim.',
                    ]}
                />
                <p>
                    Your details are never shown publicly. If you leave a
                    review, only your star rating is used in the business's
                    public rating.
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
                    number, license number and notes.
                </p>
                {privacy.acceptsBankTransfer && (
                    <p>
                        Transfer screenshots are deleted sooner:{' '}
                        <strong className="text-foreground">
                            {privacy.proofRetentionDays}{' '}
                            {privacy.proofRetentionDays === 1 ? 'day' : 'days'}
                        </strong>{' '}
                        after your trip, once the owner has checked the payment.
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
                    over an encrypted connection. Only {owner}'s account can see
                    your booking. The link to manage your booking contains a
                    long random signature, and transfer screenshots are stored
                    privately and shown only to the owner.
                </p>
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
