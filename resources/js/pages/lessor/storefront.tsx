import { Form, Head, Link, usePage } from '@inertiajs/react';
import StorefrontController from '@/actions/App/Http/Controllers/Lessor/StorefrontController';
import { FormField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { BrandColorField } from '@/components/lessor/brand-color-field';
import { FormSaveBar } from '@/components/form-save-bar';
import { FormSection } from '@/components/lessor/form-section';
import { PageHeader } from '@/components/lessor/page-header';
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

export default function LessorStorefront({
    storefront,
    suggestedSlug,
    pickupLocations,
}: {
    storefront: Storefront | null;
    suggestedSlug: string | null;
    pickupLocations: PickupLocation[];
}) {
    const { auth, name: appName } = usePage().props;

    return (
        <>
            <Head title="Booking page" />

            <div className="mx-auto w-full max-w-4xl space-y-8 p-4 md:p-8">
                <PageHeader
                    eyebrow="Your storefront"
                    title="Booking page"
                    description="Your own branded page that lists only your cars. Renters book you directly."
                />

                <StorefrontLinkCard storefront={storefront} />

                <Form
                    {...StorefrontController.update.form()}
                    options={{ preserveScroll: true }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <FormSection
                                step={1}
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
                                step={2}
                                title="Location and contact"
                                description="Your main location and how renters reach you. Manage addresses under Pickup locations."
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField
                                        id="main_pickup_location_id"
                                        label="Main location"
                                        error={errors.main_pickup_location_id}
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
                                                        pickupLocations[0].id,
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
                                </div>
                            </FormSection>

                            <FormSection
                                step={3}
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
                                                storefront?.facebook_url ?? ''
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
                                                storefront?.instagram_url ?? ''
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
                                step={4}
                                title="Branding and visibility"
                                description="Your logo and color, and whether renters can find you in the directory."
                            >
                                <div className="space-y-6">
                                    <FormField
                                        id="logo"
                                        label="Logo"
                                        error={errors.logo}
                                        hint="Square JPG, PNG or WebP, up to 2 MB."
                                    >
                                        <div className="flex items-center gap-4">
                                            {storefront && (
                                                <StorefrontLogo
                                                    storefront={storefront}
                                                    className="size-14"
                                                />
                                            )}
                                            <Input
                                                id="logo"
                                                name="logo"
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                            />
                                        </div>
                                    </FormField>
                                    <div className="space-y-2">
                                        <Label>Brand color</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Used for buttons, prices and
                                            highlights on your booking page.
                                        </p>
                                        <BrandColorField
                                            defaultValue={
                                                storefront?.brand_color ?? null
                                            }
                                        />
                                        <InputError
                                            message={errors.brand_color}
                                        />
                                    </div>
                                    <div className="flex items-start justify-between gap-4 rounded-2xl border bg-muted/30 p-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="listed_in_directory">
                                                List my business in the{' '}
                                                {appName} renter directory
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Help renters searching by city
                                                find your booking page. Your
                                                page itself never shows other
                                                businesses.
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
            </div>
        </>
    );
}

LessorStorefront.layout = {
    breadcrumbs: [{ title: 'Booking page', href: lessor.storefront.edit() }],
};
