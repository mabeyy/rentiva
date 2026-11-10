import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ImageUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import StorefrontController from '@/actions/App/Http/Controllers/Lessor/StorefrontController';
import { FormField } from '@/components/form-field';
import { InfoTip } from '@/components/info-tip';
import InputError from '@/components/input-error';
import { BrandColorField } from '@/components/lessor/brand-color-field';
import { FormSaveBar } from '@/components/form-save-bar';
import { FormSection } from '@/components/lessor/form-section';
import { PageHeader } from '@/components/lessor/page-header';
import { SectionNav } from '@/components/lessor/section-nav';
import { OptionSelect } from '@/components/option-select';
import { StorefrontLinkCard } from '@/components/storefront/storefront-link-card';
import { StorefrontLogo } from '@/components/storefront/storefront-logo';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import lessor from '@/routes/lessor';
import storefronts from '@/routes/storefronts';
import type { PickupLocation, Storefront } from '@/types';
import { FilePicker } from '@/components/file-picker';

const storefrontSections = [
    { id: 'business', label: 'Your business' },
    { id: 'contact', label: 'Location and contact' },
    { id: 'social', label: 'Social media' },
    { id: 'branding', label: 'Branding and visibility' },
] as const;

export default function LessorStorefront({
    storefront,
    suggestedSlug,
    pickupLocations,
    notificationEmail,
    accountEmail,
}: {
    storefront: Storefront | null;
    suggestedSlug: string | null;
    pickupLocations: PickupLocation[];
    /** Where the owner's booking emails go; blank uses the login email. */
    notificationEmail: string | null;
    accountEmail: string;
}) {
    const { auth, name: appName } = usePage().props;
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    // Free the previewed file's memory when it changes or the page closes.
    useEffect(
        () => () => {
            if (logoPreview) {
                URL.revokeObjectURL(logoPreview);
            }
        },
        [logoPreview],
    );

    return (
        <>
            <Head title="Booking page" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <PageHeader
                    title="Booking page"
                    description="Your own branded page that lists only your cars. Renters book you directly."
                />

                <StorefrontLinkCard storefront={storefront} />

                <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
                    <Form
                        {...StorefrontController.update.form()}
                        options={{ preserveScroll: true }}
                        resetOnSuccess={['logo']}
                        onSuccess={() => setLogoPreview(null)}
                        className="space-y-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <FormSection
                                    id="business"
                                    title="Your business"
                                    description="The name and address renters see at the top of your page."
                                >
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <FormField
                                            id="name"
                                            label="Business name"
                                            error={errors.name}
                                        >
                                            <Input
                                                id="name"
                                                name="name"
                                                required
                                                defaultValue={
                                                    storefront?.name ??
                                                    auth.user.name
                                                }
                                            />
                                        </FormField>
                                        <FormField
                                            id="slug"
                                            label="Page address"
                                            error={errors.slug}
                                            hint={`Your link: ${storefronts.show.url('your-address')}`}
                                        >
                                            <Input
                                                id="slug"
                                                name="slug"
                                                required
                                                defaultValue={
                                                    storefront?.slug ??
                                                    suggestedSlug ??
                                                    ''
                                                }
                                            />
                                        </FormField>
                                        <FormField
                                            id="tagline"
                                            label="Tagline"
                                            error={errors.tagline}
                                            className="sm:col-span-2"
                                        >
                                            <Input
                                                id="tagline"
                                                name="tagline"
                                                defaultValue={
                                                    storefront?.tagline ?? ''
                                                }
                                                placeholder="Clean, well-maintained cars at fair daily rates."
                                            />
                                        </FormField>
                                        <FormField
                                            id="about"
                                            label="About your business"
                                            error={errors.about}
                                            className="sm:col-span-2"
                                        >
                                            <Textarea
                                                id="about"
                                                name="about"
                                                rows={4}
                                                defaultValue={
                                                    storefront?.about ?? ''
                                                }
                                                placeholder="Years in business, delivery areas, requirements for renters…"
                                            />
                                        </FormField>
                                    </div>
                                </FormSection>

                                <FormSection
                                    id="contact"
                                    title="Location and contact"
                                    description="Your main location, how renters reach you, and where booking emails go. Manage addresses under Pickup locations."
                                >
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <FormField
                                            id="main_pickup_location_id"
                                            label="Main location"
                                            error={
                                                errors.main_pickup_location_id
                                            }
                                            className="sm:col-span-2"
                                            hint="Its city shows on your page and in the renter directory."
                                        >
                                            {pickupLocations.length > 0 ? (
                                                <OptionSelect
                                                    id="main_pickup_location_id"
                                                    name="main_pickup_location_id"
                                                    options={pickupLocations.map(
                                                        (location) => ({
                                                            value: String(
                                                                location.id,
                                                            ),
                                                            label: `${location.address}, ${location.city}`,
                                                        }),
                                                    )}
                                                    defaultValue={String(
                                                        storefront?.main_pickup_location_id ??
                                                            pickupLocations[0]
                                                                .id,
                                                    )}
                                                />
                                            ) : (
                                                <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                                                    No pickup locations yet.{' '}
                                                    <Link
                                                        href={lessor.pickupLocations.index()}
                                                        className="font-medium text-foreground underline underline-offset-4"
                                                    >
                                                        Add one
                                                    </Link>
                                                </p>
                                            )}
                                        </FormField>
                                        <FormField
                                            id="phone"
                                            label="Business mobile number"
                                            error={errors.phone}
                                        >
                                            <Input
                                                id="phone"
                                                name="phone"
                                                defaultValue={
                                                    storefront?.phone ?? ''
                                                }
                                                placeholder="09171234567"
                                            />
                                        </FormField>
                                        <FormField
                                            id="notification_email"
                                            label="Notification email"
                                            error={errors.notification_email}
                                            hint={`Leave blank to use ${accountEmail}.`}
                                            info="New booking requests, payment proofs and car reminders are emailed here, e.g. a shared inbox your staff check. Password resets and invoices still go to your login email. Renters don't see it."
                                        >
                                            <Input
                                                id="notification_email"
                                                name="notification_email"
                                                type="email"
                                                defaultValue={
                                                    notificationEmail ?? ''
                                                }
                                                placeholder={accountEmail}
                                            />
                                        </FormField>
                                    </div>
                                </FormSection>

                                <FormSection
                                    id="social"
                                    title="Social media"
                                    description="Renters often check your page before booking. Leave blank to hide."
                                >
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <FormField
                                            id="facebook_url"
                                            label="Facebook page"
                                            error={errors.facebook_url}
                                        >
                                            <Input
                                                id="facebook_url"
                                                name="facebook_url"
                                                type="url"
                                                inputMode="url"
                                                defaultValue={
                                                    storefront?.facebook_url ??
                                                    ''
                                                }
                                                placeholder="https://facebook.com/yourpage"
                                            />
                                        </FormField>
                                        <FormField
                                            id="instagram_url"
                                            label="Instagram"
                                            error={errors.instagram_url}
                                        >
                                            <Input
                                                id="instagram_url"
                                                name="instagram_url"
                                                type="url"
                                                inputMode="url"
                                                defaultValue={
                                                    storefront?.instagram_url ??
                                                    ''
                                                }
                                                placeholder="https://instagram.com/yourname"
                                            />
                                        </FormField>
                                        <FormField
                                            id="tiktok_url"
                                            label="TikTok"
                                            error={errors.tiktok_url}
                                        >
                                            <Input
                                                id="tiktok_url"
                                                name="tiktok_url"
                                                type="url"
                                                inputMode="url"
                                                defaultValue={
                                                    storefront?.tiktok_url ?? ''
                                                }
                                                placeholder="https://tiktok.com/@yourname"
                                            />
                                        </FormField>
                                    </div>
                                </FormSection>

                                <FormSection
                                    id="branding"
                                    title="Branding and visibility"
                                    description="Your logo and color, and whether renters can find you in the directory."
                                >
                                    <div className="space-y-6">
                                        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                                            <FormField
                                                id="logo"
                                                label="Logo"
                                                error={errors.logo}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <label
                                                        htmlFor="logo"
                                                        title="Change logo"
                                                        className="group relative size-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border bg-white"
                                                    >
                                                        {logoPreview ? (
                                                            <img
                                                                src={
                                                                    logoPreview
                                                                }
                                                                alt="New logo preview"
                                                                className="size-full object-cover"
                                                            />
                                                        ) : storefront ? (
                                                            <StorefrontLogo
                                                                storefront={
                                                                    storefront
                                                                }
                                                                className="size-full rounded-xl"
                                                            />
                                                        ) : (
                                                            <span className="flex size-full items-center justify-center rounded-xl border border-dashed text-muted-foreground">
                                                                <ImageUp className="size-5" />
                                                            </span>
                                                        )}
                                                        <span className="absolute inset-0 flex items-center justify-center bg-ink/60 text-ink-foreground opacity-0 transition-opacity group-hover:opacity-100">
                                                            <ImageUp className="size-5" />
                                                        </span>
                                                    </label>
                                                    <div className="min-w-0 flex-1 space-y-1.5">
                                                        <FilePicker
                                                            id="logo"
                                                            name="logo"
                                                            onFiles={(files) =>
                                                                setLogoPreview(
                                                                    files[0]
                                                                        ? URL.createObjectURL(
                                                                              files[0],
                                                                          )
                                                                        : null,
                                                                )
                                                            }
                                                        />
                                                        <p className="text-xs text-muted-foreground">
                                                            {logoPreview
                                                                ? 'New logo, not saved yet.'
                                                                : 'Square JPG, PNG or WebP, up to 2 MB.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </FormField>
                                            <div className="grid content-start gap-2">
                                                <div className="flex min-h-4 items-center gap-1">
                                                    <Label>Brand color</Label>
                                                    <InfoTip>
                                                        Used for buttons, prices
                                                        and highlights on your
                                                        booking page.
                                                    </InfoTip>
                                                </div>
                                                <BrandColorField
                                                    defaultValue={
                                                        storefront?.brand_color ??
                                                        null
                                                    }
                                                />
                                                <InputError
                                                    message={errors.brand_color}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-start justify-between gap-4 rounded-2xl border bg-muted/30 p-4">
                                            <div className="space-y-1">
                                                <Label htmlFor="listed_in_directory">
                                                    List my business in the{' '}
                                                    {appName} renter directory
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Help renters searching by
                                                    city find your booking page.
                                                    Your page itself never shows
                                                    other businesses.
                                                </p>
                                            </div>
                                            <Switch
                                                id="listed_in_directory"
                                                name="listed_in_directory"
                                                value="1"
                                                defaultChecked={
                                                    storefront?.listed_in_directory ??
                                                    true
                                                }
                                            />
                                        </div>
                                    </div>
                                </FormSection>

                                <FormSaveBar
                                    label="Save booking page"
                                    hint="Changes show on your booking page right away."
                                    processing={processing}
                                />
                            </>
                        )}
                    </Form>

                    <SectionNav sections={storefrontSections} />
                </div>
            </div>
        </>
    );
}

LessorStorefront.layout = {
    breadcrumbs: [{ title: 'Booking page', href: lessor.storefront.edit() }],
};
