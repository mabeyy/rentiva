import { Form, Head, Link } from '@inertiajs/react';
import { Store } from 'lucide-react';
import { useState } from 'react';
import PaymentSettingController from '@/actions/App/Http/Controllers/Lessor/PaymentSettingController';
import { EmptyState } from '@/components/empty-state';
import { FormSaveBar } from '@/components/form-save-bar';
import { PageHeader } from '@/components/lessor/page-header';
import { SectionNav } from '@/components/lessor/section-nav';
import type { PaymentSettings } from '@/components/lessor/payment-settings-section';
import { PaymentSettingsSection } from '@/components/lessor/payment-settings-section';
import { BrandButton } from '@/components/public/brand-button';
import lessor from '@/routes/lessor';

const paymentSections = [
    { id: 'methods', label: 'How renters pay' },
    { id: 'accounts', label: 'Transfer accounts' },
    { id: 'rules', label: 'Transfer rules' },
];

export default function LessorPayments({
    settings,
}: {
    /** Null until the lessor creates their booking page. */
    settings: PaymentSettings | null;
}) {
    const [acceptsTransfer, setAcceptsTransfer] = useState(
        settings?.accepts_bank_transfer ?? false,
    );

    return (
        <>
            <Head title="Payments" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <PageHeader
                    title="Payments"
                    description="Choose how renters pay you. Transfers they send show on the Transfers page for you to check."
                />

                {settings ? (
                    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
                        <Form
                            {...PaymentSettingController.update.form()}
                            options={{ preserveScroll: true }}
                            className="space-y-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <PaymentSettingsSection
                                        settings={settings}
                                        errors={errors}
                                        acceptsTransfer={acceptsTransfer}
                                        onAcceptsTransferChange={
                                            setAcceptsTransfer
                                        }
                                    />
                                    <FormSaveBar
                                        label="Save payment settings"
                                        hint="Applies to new booking requests."
                                        processing={processing}
                                    />
                                </>
                            )}
                        </Form>

                        <SectionNav
                            sections={
                                acceptsTransfer
                                    ? paymentSections
                                    : paymentSections.slice(0, 1)
                            }
                        />
                    </div>
                ) : (
                    <EmptyState
                        icon={Store}
                        title="Set up your booking page first"
                        description="Payment methods are shown on your booking page, so create it before choosing how renters pay."
                        action={
                            <BrandButton className="rounded-full px-5" asChild>
                                <Link href={lessor.storefront.edit()}>
                                    Create booking page
                                </Link>
                            </BrandButton>
                        }
                    />
                )}
            </div>
        </>
    );
}

LessorPayments.layout = {
    breadcrumbs: [{ title: 'Payments', href: lessor.payments.edit() }],
};
