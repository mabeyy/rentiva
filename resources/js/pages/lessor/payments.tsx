import { Form, Head, Link } from '@inertiajs/react';
import { Store } from 'lucide-react';
import PaymentSettingController from '@/actions/App/Http/Controllers/Lessor/PaymentSettingController';
import { EmptyState } from '@/components/empty-state';
import { FormSaveBar } from '@/components/form-save-bar';
import { FormSection } from '@/components/lessor/form-section';
import { PageHeader } from '@/components/lessor/page-header';
import type { PaymentSettings } from '@/components/lessor/payment-settings-section';
import { PaymentSettingsSection } from '@/components/lessor/payment-settings-section';
import { BrandButton } from '@/components/public/brand-button';
import lessor from '@/routes/lessor';

export default function LessorPayments({
    settings,
}: {
    /** Null until the lessor creates their booking page. */
    settings: PaymentSettings | null;
}) {
    return (
        <>
            <Head title="Payments" />

            <div className="mx-auto w-full max-w-5xl space-y-10 p-4 md:p-8">
                <PageHeader
                    eyebrow="Getting paid"
                    title="Payments"
                    description="Choose how renters pay you and which accounts they transfer to. Check transfers on the Transfers page."
                />

                {settings ? (
                    <Form
                        {...PaymentSettingController.update.form()}
                        options={{ preserveScroll: true }}
                        className="space-y-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <FormSection
                                    title="Payment methods"
                                    description="Renters pick one of these when they book. You can accept both."
                                >
                                    <PaymentSettingsSection
                                        settings={settings}
                                        errors={errors}
                                    />
                                </FormSection>
                                <FormSaveBar
                                    label="Save payment settings"
                                    hint="Applies to new booking requests."
                                    processing={processing}
                                />
                            </>
                        )}
                    </Form>
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
