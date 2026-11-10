import { Head, router, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    CarFront,
    Landmark,
    Lock,
    Plus,
    Send,
    Trash2,
    UserCog,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { FormField } from '@/components/form-field';
import { InfoTip } from '@/components/info-tip';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
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

/** An icon for each permission, matching the owner-area menu. */
const permissionIcons: Record<string, LucideIcon> = {
    bookings: CalendarDays,
    cars: CarFront,
    payments: Landmark,
    customers: Users,
};

/** What each permission lets staff do, in plain words. */
const permissionDescriptions: Record<string, string> = {
    bookings: 'Confirm requests, add bookings and see the calendar.',
    cars: 'Cars, blocked dates, pickup locations, seasons and maintenance.',
    payments: 'Check and approve the transfers renters send.',
    customers: 'See renters and reply to reviews.',
};

/** Permissions as cards to tick, two by two. */
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
        <div className="grid gap-2 sm:grid-cols-2">
            {permissions.map((permission) => {
                const Icon = permissionIcons[permission.value] ?? UserCog;
                const isOn = value.includes(permission.value);

                return (
                    <label
                        key={permission.value}
                        className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors hover:border-foreground/30',
                            isOn &&
                                'border-brand/60 bg-brand/5 hover:border-brand/60',
                        )}
                    >
                        <Icon
                            className={cn(
                                'mt-0.5 size-4 shrink-0 text-muted-foreground',
                                isOn && 'text-brand',
                            )}
                        />
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">
                                {shortLabel(permission.label)}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                                {permissionDescriptions[permission.value] ??
                                    permission.label}
                            </span>
                        </span>
                        <Checkbox
                            checked={isOn}
                            onCheckedChange={(checked) =>
                                onChange(
                                    checked
                                        ? [...value, permission.value]
                                        : value.filter(
                                              (item) =>
                                                  item !== permission.value,
                                          ),
                                )
                            }
                            className="data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=checked]:text-brand-foreground"
                        />
                    </label>
                );
            })}
        </div>
    );
}

/** A column header from a permission's label, e.g. "Cars" or "Transfers". */
function shortLabel(label: string): string {
    const first = label.replace(/^Checking /, '').split(/,| and /)[0];

    return first.charAt(0).toUpperCase() + first.slice(1);
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
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {initials(member.name)}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate font-medium">{member.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                            {member.email}
                        </p>
                    </div>
                </div>
                <InputError message={form.errors.permissions} />
            </TableCell>
            {permissions.map((permission) => (
                <TableCell key={permission.value} className="text-center">
                    <Checkbox
                        aria-label={`${member.name}: ${permission.label}`}
                        checked={form.data.permissions.includes(
                            permission.value,
                        )}
                        onCheckedChange={(checked) =>
                            form.setData(
                                'permissions',
                                checked
                                    ? [
                                          ...form.data.permissions,
                                          permission.value,
                                      ]
                                    : form.data.permissions.filter(
                                          (item) => item !== permission.value,
                                      ),
                            )
                        }
                        className="data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=checked]:text-brand-foreground"
                    />
                </TableCell>
            ))}
            <TableCell className="text-right whitespace-nowrap">
                {isDirty && (
                    <Button
                        size="sm"
                        className="mr-1 rounded-full"
                        disabled={
                            form.processing ||
                            form.data.permissions.length === 0
                        }
                        onClick={() =>
                            form.put(lessor.team.update(member.id).url, {
                                preserveScroll: true,
                            })
                        }
                    >
                        Save
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    tooltip="Resend invite"
                    aria-label={`Resend invite to ${member.name}`}
                    className="text-muted-foreground"
                    onClick={() =>
                        router.post(
                            lessor.team.resend(member.id).url,
                            {},
                            { preserveScroll: true },
                        )
                    }
                >
                    <Send />
                </Button>
                <ConfirmDialog
                    trigger={
                        <Button
                            variant="ghost"
                            size="icon"
                            tooltip="Remove"
                            aria-label={`Remove ${member.name}`}
                            className="text-muted-foreground hover:text-destructive"
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
            </TableCell>
        </TableRow>
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
    const hasAllPermissions =
        form.data.permissions.length === permissions.length;

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

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <PageHeader
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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Staff</TableHead>
                                {permissions.map((permission) => (
                                    <TableHead
                                        key={permission.value}
                                        className="text-center"
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            {shortLabel(permission.label)}
                                            <InfoTip>
                                                {permission.label}
                                            </InfoTip>
                                        </span>
                                    </TableHead>
                                ))}
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map((member) => (
                                <MemberRow
                                    key={member.id}
                                    member={member}
                                    permissions={permissions}
                                />
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <EmptyState
                        icon={Users}
                        title="Just you for now"
                        description="Invite a front-desk person or driver. They get their own sign-in and only see what you allow."
                    />
                )}
            </div>

            <Dialog open={isInviting} onOpenChange={setIsInviting}>
                <DialogContent className="sm:max-w-lg">
                    <form onSubmit={submit} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>Invite staff</DialogTitle>
                            <DialogDescription>
                                We email them a link to choose a password. They
                                sign in with their own account.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 sm:grid-cols-2">
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
                                    placeholder="Juan Dela Cruz"
                                    autoComplete="off"
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
                                        form.setData(
                                            'email',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="juan@example.com"
                                    autoComplete="off"
                                    required
                                />
                            </FormField>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium">
                                    They can manage
                                </p>
                                <button
                                    type="button"
                                    onClick={() =>
                                        form.setData(
                                            'permissions',
                                            hasAllPermissions
                                                ? []
                                                : permissions.map(
                                                      (permission) =>
                                                          permission.value,
                                                  ),
                                        )
                                    }
                                    className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                                >
                                    {hasAllPermissions
                                        ? 'Clear all'
                                        : 'Select all'}
                                </button>
                            </div>
                            <PermissionChecklist
                                permissions={permissions}
                                value={form.data.permissions}
                                onChange={(next) =>
                                    form.setData('permissions', next)
                                }
                            />
                            <InputError message={form.errors.permissions} />
                            <p className="flex gap-2 pt-1 text-xs text-muted-foreground">
                                <Lock className="size-3.5 shrink-0" />
                                Money settings, your booking page, billing and
                                the team always stay with you.
                            </p>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsInviting(false)}
                            >
                                Cancel
                            </Button>
                            <BrandButton
                                type="submit"
                                disabled={
                                    form.processing ||
                                    form.data.permissions.length === 0
                                }
                            >
                                {form.processing ? <Spinner /> : <Send />}
                                Send invitation
                            </BrandButton>
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
