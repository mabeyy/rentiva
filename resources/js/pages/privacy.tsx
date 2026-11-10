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

/**
 * Rentiva's own privacy notice, for owners and for renters booking through an
 * owner's page, with the platform's retention periods.
 */
export default function Privacy({
    lastUpdated,
    contactEmail,
    retentionMonths,
    proofRetentionDays,
    visitRetentionMonths,
    dataProtection,
}: {
    lastUpdated: string;
    contactEmail: string;
    retentionMonths: number;
    proofRetentionDays: number;
    visitRetentionMonths: number;
    dataProtection: DataProtection;
}) {
    const { name } = usePage().props;
    const mailLink = (address: string) => (
        <a
            href={`mailto:${address}`}
            className="font-medium text-foreground underline underline-offset-4"
        >
            {address}
        </a>
    );
    const operator =
        dataProtection.legalName === name
            ? name
            : `${dataProtection.legalName} ("${name}")`;

    return (
        <LegalPage
            title="Privacy notice"
            intro={`How ${name} handles personal information for the rental businesses that use it and the renters who book with them.`}
            lastUpdated={lastUpdated}
        >
            <LegalSection heading="Who is responsible for your data">
                <p>
                    {operator} gives car and motorcycle rental businesses their
                    own booking pages. When you book, you book directly with
                    that business. The business is the personal information
                    controller for your booking, and {name} processes it on
                    their behalf.
                </p>
                <p>
                    For rental owners who create an account, {name} is the
                    controller of their account details.
                </p>
                <p>
                    Our Data Protection Officer
                    {dataProtection.dpoName &&
                        `, ${dataProtection.dpoName},`}{' '}
                    can be reached at {mailLink(dataProtection.dpoEmail)}. For
                    anything else, email {mailLink(contactEmail)}.
                </p>
                <p>
                    This notice is provided under the Data Privacy Act of 2012
                    (Republic Act No. 10173), its implementing rules and the
                    issuances of the National Privacy Commission.
                </p>
            </LegalSection>

            <LegalSection heading="What we collect">
                <p>For renters, on behalf of the business you book with:</p>
                <LegalList
                    items={[
                        "Your name, email address, mobile number and driver's license number.",
                        "A photo of your driver's license, if the business asks for one.",
                        'The booking: vehicle, dates, total and any note you add.',
                        'If you pay by bank transfer: the reference number and transfer screenshot.',
                    ]}
                />
                <p>For rental owners:</p>
                <LegalList
                    items={[
                        'Your name, email address and password (stored securely as a hash).',
                        'Your business details, listings, photos and payment account details you choose to add.',
                        'Your subscription invoices and the payment receipts you upload.',
                    ]}
                />
                <p>For everyone who visits:</p>
                <LegalList
                    items={[
                        'Your IP address and browser details, used to keep forms from being abused and to count visits.',
                    ]}
                />
            </LegalSection>

            <LegalSection heading="Why we use it">
                <LegalList
                    items={[
                        'To take, confirm and manage bookings between renters and rental businesses. This is needed to carry out the rental you asked for.',
                        'To run owner accounts and bill subscriptions, under our agreement with each owner.',
                        'To send booking emails and, where the business has them on, text messages.',
                        'To keep the service secure and stop spam and fraud, which is our legitimate interest.',
                        'To count visits so owners can see how their booking page is doing and we can improve the service.',
                        'To meet legal, tax and accounting duties.',
                    ]}
                />
                <p>
                    We do not sell personal information, use it for advertising,
                    or make automated decisions about you.
                </p>
            </LegalSection>

            <LegalSection heading="Cookies and visit counting">
                <p>
                    We only use cookies needed for the site to work: to keep you
                    signed in, to protect forms, and to remember display
                    preferences such as dark mode. There are no advertising or
                    tracking cookies.
                </p>
                <p>
                    Visits to public pages are counted without cookies. Each
                    visitor is given a code made from their IP address and
                    browser that changes every day, so we can count visitors but
                    cannot recognise you or follow you from one day to the next.
                    Visit counts are deleted after{' '}
                    {describeMonths(visitRetentionMonths)}.
                </p>
            </LegalSection>

            <LegalSection heading="How long it is kept">
                <p>
                    Renter details are kept for{' '}
                    {describeMonths(retentionMonths)} after a trip. When that
                    period ends, they are removed automatically, along with
                    license photos, pickup and return photos, notes about the
                    booking, and any private note a business kept on a renter.
                    Only the vehicle, dates and amount remain. Bank transfer
                    screenshots are deleted {proofRetentionDays}{' '}
                    {proofRetentionDays === 1 ? 'day' : 'days'} after the trip
                    (or after a cancelled booking), once checked. Records of the
                    emails and texts we send are deleted after 90 days. A rental
                    business may have a different period, shown on its own
                    privacy notice.
                </p>
                <p>
                    Owner account details are kept while the account is open,
                    and removed when the owner deletes their account. Invoices
                    for Rentiva plans are kept under the business name for our
                    accounting records.
                </p>
            </LegalSection>

            <LegalSection heading="Who else sees it">
                <LegalList
                    items={[
                        'The rental business you book with, and the staff they give access to, who see your booking and contact details.',
                        ...serviceProviders,
                        'Authorities, where the law requires it, or to establish or defend a legal claim.',
                    ]}
                />
                <p>
                    Some of these providers store data outside the Philippines.
                    We only use providers bound to protect it to the standard
                    the Data Privacy Act requires, and we stay responsible for
                    it wherever it is processed. Renters' contact details are
                    never shown publicly. A renter's review is shown on the
                    business's page with their first name and last initial.
                </p>
            </LegalSection>

            <LegalSection heading="How it is protected">
                <p>
                    Everything is sent over an encrypted connection. Passwords
                    are stored as hashes, and the email, SMS and calendar keys
                    owners give us are encrypted. Each owner only sees their own
                    bookings, staff only see what the owner allows, and the link
                    renters use to manage a booking carries a long random
                    signature. Our team accesses booking details only to give
                    support or when the law requires it.
                </p>
                <p>{breachPromise}</p>
            </LegalSection>

            <LegalSection heading="Your rights">
                <p>Under the Data Privacy Act you have the right to:</p>
                <LegalList items={dataPrivacyRights} />
                <p>
                    Renters should first contact the rental business they booked
                    with, using the details on its privacy notice. You can also
                    write to our Data Protection Officer at{' '}
                    {mailLink(dataProtection.dpoEmail)}. We reply within 15
                    working days. You may complain to the National Privacy
                    Commission (privacy.gov.ph).
                </p>
            </LegalSection>

            <LegalSection heading="Age">
                <p>
                    Renters must be at least 21 and hold a valid driver's
                    license. {name} is not meant for children and we do not
                    knowingly collect their data.
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
