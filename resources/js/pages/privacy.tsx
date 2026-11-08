import { usePage } from '@inertiajs/react';
import {
    LegalList,
    LegalPage,
    LegalSection,
    dataPrivacyRights,
    describeMonths,
} from '@/components/legal/legal-page';

/**
 * Rentiva's own privacy notice, for owners and for renters booking through an
 * owner's page, with the platform's retention periods.
 */
export default function Privacy({
    lastUpdated,
    contactEmail,
    retentionMonths,
    proofRetentionDays,
}: {
    lastUpdated: string;
    contactEmail: string;
    retentionMonths: number;
    proofRetentionDays: number;
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
            title="Privacy notice"
            intro={`How ${name} handles personal information for the rental businesses that use it and the renters who book with them.`}
            lastUpdated={lastUpdated}
        >
            <LegalSection heading="Who is responsible for your data">
                <p>
                    {name} gives car and motorcycle rental businesses their own
                    booking pages. When you book, you book directly with that
                    business. The business is the personal information
                    controller for your booking, and {name} processes it on
                    their behalf.
                </p>
                <p>
                    For rental owners who create an account, {name} is the
                    controller of their account details. You can reach us at{' '}
                    {email}.
                </p>
                <p>
                    This notice is provided under the Data Privacy Act of 2012
                    (Republic Act No. 10173) and its implementing rules.
                </p>
            </LegalSection>

            <LegalSection heading="What we collect">
                <p>For renters, on behalf of the business you book with:</p>
                <LegalList
                    items={[
                        "Your name, email address, mobile number and driver's license number.",
                        'The booking: vehicle, dates, total and any note you add.',
                        'If you pay by bank transfer: the reference number and transfer screenshot.',
                    ]}
                />
                <p>For rental owners:</p>
                <LegalList
                    items={[
                        'Your name, email address and password (stored securely as a hash).',
                        'Your business details, listings, photos and payment account details you choose to add.',
                    ]}
                />
            </LegalSection>

            <LegalSection heading="How long it is kept">
                <p>
                    Renter details are kept for{' '}
                    {describeMonths(retentionMonths)} after a trip. When that
                    period ends, they are removed automatically and only the
                    vehicle, dates and amount remain. Bank transfer screenshots
                    are deleted {proofRetentionDays}{' '}
                    {proofRetentionDays === 1 ? 'day' : 'days'} after the trip,
                    once the owner has checked them. A rental business may have
                    a different period, shown on its own privacy notice.
                </p>
                <p>
                    Owner account details are kept while the account is open,
                    and removed when the owner deletes their account.
                </p>
            </LegalSection>

            <LegalSection heading="Who else sees it">
                <LegalList
                    items={[
                        'The rental business you book with, who sees your booking and contact details.',
                        'Our hosting and email providers, who process data on our instructions.',
                        'Authorities, where the law requires it.',
                    ]}
                />
                <p>
                    We do not sell personal information or use it for
                    advertising. Renter details are never shown publicly.
                </p>
            </LegalSection>

            <LegalSection heading="Your rights">
                <p>Under the Data Privacy Act you have the right to:</p>
                <LegalList items={dataPrivacyRights} />
                <p>
                    Renters should first contact the rental business they booked
                    with, using the details on its privacy notice. You can also
                    email us at {email}. You may complain to the National
                    Privacy Commission (privacy.gov.ph).
                </p>
            </LegalSection>

            <LegalSection heading="Changes to this notice">
                <p>
                    If how we handle personal information changes, we will
                    update this page and the date above.
                </p>
            </LegalSection>
        </LegalPage>
    );
}
