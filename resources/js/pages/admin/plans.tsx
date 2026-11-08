import { Head, useForm } from '@inertiajs/react';
import { Pencil, Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { FormField } from '@/components/form-field';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatPeso } from '@/lib/format';
import admin from '@/routes/admin';
import type { Option } from '@/types';

type Plan = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    max_cars: number | null;
    max_staff: number | null;
    features: string[];
    is_active: boolean;
    sort: number;
    owners_count: number;
};

function PlanForm({
    plan,
    featureOptions,
    onDone,
}: {
    plan: Plan | null;
    featureOptions: Option[];
    onDone: () => void;
}) {
    const form = useForm({
        name: plan?.name ?? '',
        description: plan?.description ?? '',
        price: plan ? String(plan.price / 100) : '',
        max_cars: plan?.max_cars !== null && plan ? String(plan.max_cars) : '',
        max_staff:
            plan?.max_staff !== null && plan ? String(plan.max_staff) : '',
        is_active: plan?.is_active ?? true,
        features: plan?.features ?? [],
        sort: plan ? String(plan.sort) : '0',
    });

    function submit(event: FormEvent): void {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: onDone };

        if (plan) {
            form.put(admin.plans.update(plan.id).url, options);
        } else {
            form.post(admin.plans.store().url, options);
        }
    }

    const field = (
        key:
            | 'name'
            | 'description'
            | 'price'
            | 'max_cars'
            | 'max_staff'
            | 'sort',
        label: string,
        props: Record<string, unknown> = {},
    ) => (
        <FormField id={`plan_${key}`} label={label} error={form.errors[key]}>
            <Input
                id={`plan_${key}`}
                value={form.data[key]}
                onChange={(event) => form.setData(key, event.target.value)}
                {...props}
            />
        </FormField>
    );

    return (
        <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
                <DialogTitle>
                    {plan ? `Edit ${plan.name}` : 'Add a plan'}
                </DialogTitle>
            </DialogHeader>
            {field('name', 'Name', { required: true, maxLength: 60 })}
            {field('description', 'Description (optional)', { maxLength: 200 })}
            <div className="grid grid-cols-3 gap-3">
                {field('price', 'Price / month (₱)', {
                    type: 'number',
                    min: 0,
                    required: true,
                })}
                {field('max_cars', 'Max cars', {
                    type: 'number',
                    min: 1,
                    placeholder: 'Unlimited',
                })}
                {field('max_staff', 'Max staff', {
                    type: 'number',
                    min: 0,
                    placeholder: 'Unlimited',
                })}
            </div>
            <fieldset className="space-y-2 rounded-lg border p-3">
                <legend className="px-1 text-sm font-medium">
                    Included features
                </legend>
                {featureOptions.map((feature) => (
                    <label
                        key={feature.value}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                        <Checkbox
                            checked={form.data.features.includes(feature.value)}
                            onCheckedChange={(checked) =>
                                form.setData(
                                    'features',
                                    checked
                                        ? [...form.data.features, feature.value]
                                        : form.data.features.filter(
                                              (item) => item !== feature.value,
                                          ),
                                )
                            }
                        />
                        {feature.label}
                    </label>
                ))}
            </fieldset>
            <div className="grid grid-cols-2 items-end gap-3">
                {field('sort', 'Order', { type: 'number', min: 0 })}
                <label className="flex h-9 cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                        checked={form.data.is_active}
                        onCheckedChange={(checked) =>
                            form.setData('is_active', checked === true)
                        }
                    />
                    Owners can pick it
                </label>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={form.processing}>
                    {form.processing && <Spinner />}
                    Save plan
                </Button>
            </DialogFooter>
        </form>
    );
}

export default function AdminPlans({
    plans,
    featureOptions,
}: {
    plans: Plan[];
    featureOptions: Option[];
}) {
    const [editing, setEditing] = useState<Plan | 'new' | null>(null);

    return (
        <>
            <Head title="Plans" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Plans"
                        description="What owners pay Rentiva each month. The first invoice is issued when an owner picks a plan."
                    />
                    <Button onClick={() => setEditing('new')}>
                        <Plus /> Add plan
                    </Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Plan</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead>Limits</TableHead>
                            <TableHead>Features</TableHead>
                            <TableHead className="text-right">Owners</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plans.map((plan) => (
                            <TableRow key={plan.id}>
                                <TableCell>
                                    <p className="font-medium">{plan.name}</p>
                                    {plan.description && (
                                        <p className="text-xs text-muted-foreground">
                                            {plan.description}
                                        </p>
                                    )}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                    {formatPeso(plan.price)}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {plan.max_cars ?? '∞'} cars ·{' '}
                                    {plan.max_staff ?? '∞'} staff
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {plan.features.length > 0
                                        ? `${plan.features.length} of ${featureOptions.length}`
                                        : 'Basics only'}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                    {plan.owners_count}
                                </TableCell>
                                <TableCell>
                                    {plan.is_active ? 'Offered' : 'Hidden'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Edit ${plan.name}`}
                                        onClick={() => setEditing(plan)}
                                    >
                                        <Pencil />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {plans.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        No plans yet. Add one so owners can subscribe.
                    </p>
                )}
            </div>

            <Dialog
                open={editing !== null}
                onOpenChange={(isOpen) => !isOpen && setEditing(null)}
            >
                <DialogContent className="sm:max-w-lg">
                    {editing !== null && (
                        <PlanForm
                            key={editing === 'new' ? 'new' : editing.id}
                            plan={editing === 'new' ? null : editing}
                            featureOptions={featureOptions}
                            onDone={() => setEditing(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

AdminPlans.layout = {
    breadcrumbs: [{ title: 'Plans', href: admin.plans.index() }],
};
