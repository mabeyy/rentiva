import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Send, Trash2, UserCog, Users } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { FormField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/lessor/page-header';
import { BrandButton } from '@/components/public/brand-button';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import lessor from '@/routes/lessor';
import type { Option } from '@/types';

type Member = {
    id: number;
    name: string;
    email: string;
    permissions: string[];
};

/** e.g. "JD" for "Juan Dela Cruz". */
function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function PermissionChecklist({
    permissions,
    value,
    onChange,
}: {
    permissions: Option[];
    value: string[];
    onChange: (next: string[]) => void;
}) {
    return (
        <div className="space-y-2">
            {permissions.map((permission) => (
                <label
                    key={permission.value}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand/5"
                >
                    <Checkbox
                        checked={value.includes(permission.value)}
                        onCheckedChange={(checked) =>
                            onChange(
                                checked
                                    ? [...value, permission.value]
                                    : value.filter(
                                          (item) => item !== permission.value,
                                      ),
                            )
                        }
                    />
                    {permission.label}
                </label>
            ))}
        </div>
    );
}

function MemberRow({
    member,
    permissions,
}: {
    member: Member;
    permissions: Option[];
}) {
    const form = useForm({ permissions: member.permissions });
    const isDirty =
        [...form.data.permissions].sort().join() !==
        [...member.permissions].sort().join();

    return (
        <li className="space-y-4 p-5">
            <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                    {initials(member.name)}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{member.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                        {member.email}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-muted-foreground"
                    onClick={() =>
                        router.post(
                            lessor.team.resend(member.id).url,
                            {},
                            { preserveScroll: true },
                        )
                    }
                >
                    <Send /> Resend invite
                </Button>
                <ConfirmDialog
                    trigger={
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove ${member.name}`}
                        >
                            <Trash2 />
                        </Button>
                    }
                    title={`Remove ${member.name}?`}
                    description="They can no longer sign in. What they did stays in your activity log."
                    confirmLabel="Remove"
                    onConfirm={() =>
                        router.delete(lessor.team.destroy(member.id).url, {
                            preserveScroll: true,
                        })
                    }
                />
            </div>
            <div className="flex flex-wrap gap-2">
                {permissions.map((permission) => {
                    const isOn = form.data.permissions.includes(
                        permission.value,
                    );

                    return (
                        <button
                            key={permission.value}
                            type="button"
                            aria-pressed={isOn}
                            onClick={() =>
                                form.setData(
                                    'permissions',
                                    isOn
                                        ? form.data.permissions.filter(
                                              (item) =>
                                                  item !== permission.value,
                                          )
                                        : [
                                              ...form.data.permissions,
                                              permission.value,
                                          ],
                                )
                            }
                            className={
                                isOn
                                    ? 'rounded-full border border-brand bg-brand/10 px-3 py-1 text-xs font-medium text-brand'
                                    : 'rounded-full border px-3 py-1 text-xs text-muted-foreground hover:text-foreground'
                            }
                        >
                            {permission.label}
                        </button>
                    );
                })}
                {isDirty && (
                    <Button
                        size="sm"
                        className="h-7 rounded-full"
                        disabled={form.processing}
                        onClick={() =>
                            form.put(lessor.team.update(member.id).url, {
                                preserveScroll: true,
                            })
                        }
                    >
                        Save
                    </Button>
                )}
            </div>
            <InputError message={form.errors.permissions} />
        </li>
    );
}

export default function LessorTeam({
    members,
    permissions,
    staffLimit,
}: {
    members: Member[];
    permissions: Option[];
    staffLimit: number | null;
}) {
    const [isInviting, setIsInviting] = useState(false);
    const form = useForm<{
        name: string;
        email: string;
        permissions: string[];
    }>({ name: '', email: '', permissions: ['bookings'] });
    const isFull = staffLimit !== null && members.length >= staffLimit;

    function submit(event: FormEvent): void {
        event.preventDefault();
        form.post(lessor.team.store().url, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setIsInviting(false);
            },
        });
    }

    return (
        <>
            <Head title="Team" />

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-8">
                <PageHeader
                    eyebrow="Your business"
                    title="Team"
                    description="Invite staff to help with bookings, cars, payments or renters. Money settings, your booking page, billing and the team stay with you."
                    actions={
                        <BrandButton
                            className="h-11 rounded-full px-5"
                            disabled={isFull}
                            onClick={() => setIsInviting(true)}
                        >
                            <Plus /> Invite staff
                        </BrandButton>
                    }
                />

                {staffLimit !== null && (
                    <p className="text-sm text-muted-foreground">
                        {members.length} of {staffLimit} staff on your plan.
                    </p>
                )}

                {members.length > 0 ? (
                    <ul className="divide-y rounded-3xl border bg-background">
                        {members.map((member) => (
                            <MemberRow
                                key={member.id}
                                member={member}
                                permissions={permissions}
                            />
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        icon={Users}
                        title="Just you for now"
                        description="Invite a front-desk person or driver. They get their own sign-in and only see what you allow."
                    />
                )}
            </div>

            <Dialog open={isInviting} onOpenChange={setIsInviting}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={submit} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <UserCog className="size-5 text-brand" />
                                Invite staff
                            </DialogTitle>
                            <DialogDescription>
                                They get an email to choose a password, then
                                sign in to your owner area.
                            </DialogDescription>
                        </DialogHeader>
                        <FormField
                            id="staff_name"
                            label="Name"
                            error={form.errors.name}
                        >
                            <Input
                                id="staff_name"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                required
                            />
                        </FormField>
                        <FormField
                            id="staff_email"
                            label="Email"
                            error={form.errors.email}
                        >
                            <Input
                                id="staff_email"
                                type="email"
                                value={form.data.email}
                                onChange={(event) =>
                                    form.setData('email', event.target.value)
                                }
                                required
                            />
                        </FormField>
                        <FormField
                            id="staff_permissions"
                            label="They can manage"
                            error={form.errors.permissions}
                        >
                            <PermissionChecklist
                                permissions={permissions}
                                value={form.data.permissions}
                                onChange={(next) =>
                                    form.setData('permissions', next)
                                }
                            />
                        </FormField>
                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={
                                    form.processing ||
                                    form.data.permissions.length === 0
                                }
                            >
                                {form.processing && <Spinner />}
                                Send invitation
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

LessorTeam.layout = {
    breadcrumbs: [{ title: 'Team', href: lessor.team.index() }],
};
