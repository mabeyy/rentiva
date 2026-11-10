import { Form, Head, router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import FeatureController from '@/actions/App/Http/Controllers/Admin/FeatureController';
import { ConfirmDialog } from '@/components/confirm-dialog';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { OptionSelect } from '@/components/option-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import admin from '@/routes/admin';
import type { Feature, Option } from '@/types';

/** One feature's name, group and vehicles, saved together. */
function FeatureRow({
    feature,
    categories,
    vehicleOptions,
}: {
    feature: Feature;
    categories: Option[];
    vehicleOptions: Option[];
}) {
    return (
        <li className="flex flex-wrap items-start gap-2 py-3">
            <Form
                {...FeatureController.update.form(feature.id)}
                options={{ preserveScroll: true }}
                className="flex flex-1 flex-wrap items-start gap-2"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="min-w-48 flex-1 space-y-1">
                            <Input
                                name="name"
                                defaultValue={feature.name}
                                aria-label="Feature name"
                                required
                            />
                            <InputError message={errors.name} />
                        </div>
                        <OptionSelect
                            name="vehicles"
                            options={vehicleOptions}
                            defaultValue={feature.vehicles}
                            className="w-52"
                        />
                        <OptionSelect
                            name="category"
                            options={categories}
                            defaultValue={feature.category}
                            className="w-36"
                        />
                        <Button
                            type="submit"
                            size="sm"
                            variant="secondary"
                            className="h-9"
                            disabled={processing}
                        >
                            Save
                        </Button>
                    </>
                )}
            </Form>
            <span className="flex h-9 w-16 items-center justify-end text-sm text-muted-foreground tabular-nums">
                {feature.cars_count} {feature.cars_count === 1 ? 'car' : 'cars'}
            </span>
            <ConfirmDialog
                trigger={
                    <Button
                        variant="ghost"
                        size="icon"
                        tooltip="Remove"
                        aria-label={`Remove ${feature.name}`}
                    >
                        <Trash2 />
                    </Button>
                }
                title={`Remove "${feature.name}"?`}
                description="It is removed from the catalog and from every car that lists it."
                confirmLabel="Remove"
                onConfirm={() =>
                    router.delete(FeatureController.destroy.url(feature.id), {
                        preserveScroll: true,
                    })
                }
            />
        </li>
    );
}

/**
 * The feature checklist owners pick from, grouped as owners see it, with
 * which vehicles each one shows for.
 */
export default function AdminFeaturesIndex({
    features,
    categories,
    vehicleOptions,
}: {
    features: Feature[];
    categories: Option[];
    vehicleOptions: Option[];
}) {
    return (
        <>
            <Head title="Features" />

            <div className="mx-auto w-full max-w-5xl space-y-8 p-4 md:p-6">
                <Heading
                    title="Features"
                    description="The checklist owners pick from when listing a car, grouped the way they see it. Motorcycle features only show for motorcycles and scooters."
                />

                <Form
                    {...FeatureController.store.form()}
                    options={{ preserveScroll: true }}
                    resetOnSuccess
                    className="space-y-1 rounded-2xl border p-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <p className="mb-2 text-sm font-medium">
                                Add a feature
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Input
                                    name="name"
                                    placeholder="e.g. Heated seats"
                                    aria-label="New feature"
                                    className="min-w-48 flex-1"
                                    required
                                />
                                <OptionSelect
                                    name="vehicles"
                                    options={vehicleOptions}
                                    defaultValue="cars"
                                    className="w-52"
                                />
                                <OptionSelect
                                    name="category"
                                    options={categories}
                                    defaultValue="convenience"
                                    className="w-36"
                                />
                                <Button type="submit" disabled={processing}>
                                    Add feature
                                </Button>
                            </div>
                            <InputError message={errors.name} />
                        </>
                    )}
                </Form>

                {categories.map((category) => {
                    const inCategory = features.filter(
                        (feature) => feature.category === category.value,
                    );

                    return (
                        inCategory.length > 0 && (
                            <section key={category.value}>
                                <h2 className="text-sm font-semibold">
                                    {category.label}{' '}
                                    <span className="font-normal text-muted-foreground">
                                        · {inCategory.length}
                                    </span>
                                </h2>
                                <ul className="divide-y">
                                    {inCategory.map((feature) => (
                                        <FeatureRow
                                            key={feature.id}
                                            feature={feature}
                                            categories={categories}
                                            vehicleOptions={vehicleOptions}
                                        />
                                    ))}
                                </ul>
                            </section>
                        )
                    );
                })}
            </div>
        </>
    );
}

AdminFeaturesIndex.layout = {
    breadcrumbs: [{ title: 'Features', href: admin.features.index() }],
};
