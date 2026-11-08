import { Form, Head, router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import FeatureController from '@/actions/App/Http/Controllers/Admin/FeatureController';
import { ConfirmDialog } from '@/components/confirm-dialog';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import admin from '@/routes/admin';
import type { Feature } from '@/types';

function RenameFeatureForm({ feature }: { feature: Feature }) {
    return (
        <Form
            {...FeatureController.update.form(feature.id)}
            options={{ preserveScroll: true }}
            className="flex items-start gap-2"
        >
            {({ processing, errors, isDirty }) => (
                <div className="w-full max-w-sm space-y-1">
                    <div className="flex gap-2">
                        <Input
                            name="name"
                            defaultValue={feature.name}
                            aria-label="Feature name"
                            required
                        />
                        {isDirty && (
                            <Button
                                type="submit"
                                size="sm"
                                variant="secondary"
                                disabled={processing}
                            >
                                Save
                            </Button>
                        )}
                    </div>
                    <InputError message={errors.name} />
                </div>
            )}
        </Form>
    );
}

export default function AdminFeaturesIndex({
    features,
}: {
    features: Feature[];
}) {
    return (
        <>
            <Head title="Features" />

            <div className="max-w-3xl space-y-6 p-4 md:p-6">
                <Heading
                    title="Features"
                    description="The checklist lessors pick from when listing a car."
                />

                <Form
                    {...FeatureController.store.form()}
                    options={{ preserveScroll: true }}
                    resetOnSuccess
                    className="space-y-1"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="flex max-w-md gap-2">
                                <Input
                                    name="name"
                                    placeholder="e.g. Heated seats"
                                    aria-label="New feature"
                                    required
                                />
                                <Button type="submit" disabled={processing}>
                                    Add feature
                                </Button>
                            </div>
                            <InputError message={errors.name} />
                        </>
                    )}
                </Form>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead className="text-right">
                                Used by
                            </TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {features.map((feature) => (
                            <TableRow key={feature.id}>
                                <TableCell>
                                    <RenameFeatureForm feature={feature} />
                                </TableCell>
                                <TableCell className="text-right">
                                    {feature.cars_count} cars
                                </TableCell>
                                <TableCell className="text-right">
                                    <ConfirmDialog
                                        trigger={
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Remove ${feature.name}`}
                                            >
                                                <Trash2 />
                                            </Button>
                                        }
                                        title={`Remove "${feature.name}"?`}
                                        description="It is removed from the catalog and from every car that lists it."
                                        confirmLabel="Remove"
                                        onConfirm={() =>
                                            router.delete(
                                                FeatureController.destroy.url(
                                                    feature.id,
                                                ),
                                                { preserveScroll: true },
                                            )
                                        }
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}

AdminFeaturesIndex.layout = {
    breadcrumbs: [{ title: 'Features', href: admin.features.index() }],
};
