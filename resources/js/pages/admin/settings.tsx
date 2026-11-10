import { Form, Head, useForm } from '@inertiajs/react';
import { Info } from 'lucide-react';
import SettingController from '@/actions/App/Http/Controllers/Admin/SettingController';
import { FormField } from '@/components/form-field';
import { FormSaveBar } from '@/components/form-save-bar';
import Heading from '@/components/heading';
import { FormSection } from '@/components/lessor/form-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UnitInput } from '@/components/unit-input';
import admin from '@/routes/admin';

type Settings = {
    data_retention_months: number;
    proof_retention_days: number;
};

type Support = {
    support_email: string | null;
    support_phone: string | null;
    priority_phone: string | null;
    priority_response_hours: number;
};

/** How owners reach Rentiva, and the priority promise for plans with it. */
function SupportForm({ support }: { support: Support }) {
    const form = useForm({
        support_email: support.support_email ?? '',
        support_phone: support.support_phone ?? '',
        priority_phone: support.priority_phone ?? '',
        priority_response_hours: String(support.priority_response_hours),
    });

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                form.put(SettingController.updateSupport.url(), {
                    preserveScroll: true,
                });
            }}
        >
            <FormSection
                title="Owner support"
                description="Shown on every owner's Help page. Owners on plans with priority support also see the priority line and reply time."
            >
                <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                        id="support_email"
                        label="Support email"
                        error={form.errors.support_email}
                    >
                        <Input
                            id="support_email"
                            type="email"
                            value={form.data.support_email}
                            onChange={(event) =>
                                form.setData(
                                    'support_email',
                                    event.target.value,
                                )
                            }
                            placeholder="support@rentiva.ph"
                        />
                    </FormField>
                    <FormField
                        id="support_phone"
                        label="Support phone"
                        error={form.errors.support_phone}
                    >
                        <Input
                            id="support_phone"
                            value={form.data.support_phone}
                            onChange={(event) =>
                                form.setData(
                                    'support_phone',
                                    event.target.value,
                                )
                            }
                            placeholder="0917 123 4567"
                        />
                    </FormField>
                    <FormField
                        id="priority_phone"
                        label="Priority line"
                        error={form.errors.priority_phone}
                        hint="Call, text or Viber number for priority owners."
                    >
                        <Input
                            id="priority_phone"
                            value={form.data.priority_phone}
                            onChange={(event) =>
                                form.setData(
                                    'priority_phone',
                                    event.target.value,
                                )
                            }
                        />
                    </FormField>
                    <FormField
                        id="priority_response_hours"
                        label="Priority reply within"
                        error={form.errors.priority_response_hours}
                        hint="The promise shown to priority owners. Keep it realistic."
                    >
                        <Input
                            id="priority_response_hours"
                            type="number"
                            min={1}
                            max={72}
                            value={form.data.priority_response_hours}
                            onChange={(event) =>
                                form.setData(
                                    'priority_response_hours',
                                    event.target.value,
                                )
                            }
                            className="w-28 tabular-nums"
                        />
                    </FormField>
                </div>
                <div className="mt-5 flex justify-end">
                    <Button type="submit" disabled={form.processing}>
                        Save support details
                    </Button>
                </div>
            </FormSection>
        </form>
    );
}

type DataProtection = {
    legal_name: string | null;
    dpo_name: string | null;
    dpo_email: string | null;
};

/** Who answers for personal data, named on both privacy notices. */
function DataProtectionForm({
    dataProtection,
}: {
    dataProtection: DataProtection;
}) {
    const form = useForm({
        legal_name: dataProtection.legal_name ?? '',
        dpo_name: dataProtection.dpo_name ?? '',
        dpo_email: dataProtection.dpo_email ?? '',
    });

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                form.put(SettingController.updateDataProtection.url(), {
                    preserveScroll: true,
                });
            }}
        >
            <FormSection
                title="Data protection"
                description="The Data Privacy Act requires a Data Protection Officer that people can contact. These details appear on the privacy notices, and are the same ones you register with the National Privacy Commission."
            >
                <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                        id="legal_name"
                        label="Registered business name"
                        error={form.errors.legal_name}
                        hint="As on your DTI or SEC registration."
                        className="sm:col-span-2"
                    >
                        <Input
                            id="legal_name"
                            value={form.data.legal_name}
                            onChange={(event) =>
                                form.setData('legal_name', event.target.value)
                            }
                        />
                    </FormField>
                    <FormField
                        id="dpo_name"
                        label="Data Protection Officer"
                        error={form.errors.dpo_name}
                    >
                        <Input
                            id="dpo_name"
                            value={form.data.dpo_name}
                            onChange={(event) =>
                                form.setData('dpo_name', event.target.value)
                            }
                            placeholder="Full name"
                        />
                    </FormField>
                    <FormField
                        id="dpo_email"
                        label="DPO email"
                        error={form.errors.dpo_email}
                    >
                        <Input
                            id="dpo_email"
                            type="email"
                            value={form.data.dpo_email}
                            onChange={(event) =>
                                form.setData('dpo_email', event.target.value)
                            }
                            placeholder="dpo@rentiva.ph"
                        />
                    </FormField>
                </div>
                <div className="mt-5 flex justify-end">
                    <Button type="submit" disabled={form.processing}>
                        Save data protection details
                    </Button>
                </div>
            </FormSection>
        </form>
    );
}

export default function AdminSettings({
    settings,
    overrideCount,
    support,
    dataProtection,
}: {
    support: Support;
    dataProtection: DataProtection;
    settings: Settings;
    /** Owners the admin has given their own retention periods. */
    overrideCount: number;
}) {
    return (
        <>
            <Head title="Settings" />

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-6">
                <Heading
                    title="Settings"
                    description="Platform-wide rules and support details that apply to every owner."
                />

                <Form
                    {...SettingController.update.form()}
                    options={{ preserveScroll: true }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <FormSection
                                title="Data retention"
                                description="How long renter data is kept, as required by the Data Privacy Act. Cleanup runs automatically every night."
                            >
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <FormField
                                        id="data_retention_months"
                                        label="Keep renter details for"
                                        error={errors.data_retention_months}
                                        hint="After this, each booking keeps its car, dates and amount, but the renter's name, email, phone, license number, notes and screenshot are permanently removed."
                                    >
                                        <UnitInput
                                            id="data_retention_months"
                                            name="data_retention_months"
                                            defaultValue={
                                                settings.data_retention_months
                                            }
                                            unit="months"
                                            min={1}
                                            max={120}
                                        />
                                    </FormField>
                                    <FormField
                                        id="proof_retention_days"
                                        label="Keep transfer screenshots for"
                                        error={errors.proof_retention_days}
                                        hint="Days after the trip, once the owner has checked them. Screenshots still waiting to be checked are always kept."
                                    >
                                        <UnitInput
                                            id="proof_retention_days"
                                            name="proof_retention_days"
                                            defaultValue={
                                                settings.proof_retention_days
                                            }
                                            unit="days"
                                            min={1}
                                            max={365}
                                        />
                                    </FormField>
                                </div>

                                <p className="mt-6 flex gap-2 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
                                    <Info className="mt-0.5 size-4 shrink-0" />
                                    <span>
                                        Shown on the privacy notices.{' '}
                                        {overrideCount > 0
                                            ? `${overrideCount} ${overrideCount === 1 ? 'owner has' : 'owners have'} their own period, set on their lessor page.`
                                            : 'To give one owner a different period, open them under Lessors.'}
                                    </span>
                                </p>
                            </FormSection>

                            <FormSaveBar
                                label="Save settings"
                                hint="Applies to every owner without their own period."
                                processing={processing}
                            />
                        </>
                    )}
                </Form>

                <DataProtectionForm dataProtection={dataProtection} />

                <SupportForm support={support} />
            </div>
        </>
    );
}

AdminSettings.layout = {
    breadcrumbs: [{ title: 'Settings', href: admin.settings.edit() }],
};
