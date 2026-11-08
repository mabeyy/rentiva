import { Banknote, Landmark, Plus, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { FormField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { UpgradeNote } from '@/components/lessor/upgrade-note';
import { UnitInput } from '@/components/unit-input';

export type PaymentAccount = {
    id: number;
    bank_name: string;
    account_name: string;
    account_number: string;
    qr_url: string | null;
};

export type PaymentSettings = {
    accepts_pay_at_pickup: boolean;
    accepts_bank_transfer: boolean;
    transfer_deadline_minutes: number;
    down_payment_enabled: boolean;
    down_payment_percent: number;
    /** Whether the owner's plan includes down payments. */
    down_payment_included: boolean;
    accounts: PaymentAccount[];
};

/** Most transfer accounts an owner may list. */
const MAX_ACCOUNTS = 3;

/** A row in the form: a saved account, or a new one with a temporary key. */
type AccountRow = { key: string; account: PaymentAccount | null };

function AccountFields({
    index,
    row,
    errors,
    onRemove,
}: {
    index: number;
    row: AccountRow;
    errors: Partial<Record<string, string>>;
    onRemove: () => void;
}) {
    const field = (name: string): string => `accounts[${index}][${name}]`;
    const error = (name: string): string | undefined =>
        errors[`accounts.${index}.${name}`];
    const id = (name: string): string => `account-${row.key}-${name}`;

    return (
        <div className="space-y-4 rounded-2xl border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    Account {index + 1}
                </p>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={onRemove}
                >
                    <Trash2 /> Remove
                </Button>
            </div>
            {row.account && (
                <input
                    type="hidden"
                    name={field('id')}
                    value={row.account.id}
                />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                    id={id('bank')}
                    label="Bank or e-wallet"
                    error={error('bank_name')}
                >
                    <Input
                        id={id('bank')}
                        name={field('bank_name')}
                        defaultValue={row.account?.bank_name}
                        placeholder="BDO, BPI, GCash, Maya…"
                        className="bg-background"
                    />
                </FormField>
                <FormField
                    id={id('name')}
                    label="Account name"
                    error={error('account_name')}
                >
                    <Input
                        id={id('name')}
                        name={field('account_name')}
                        defaultValue={row.account?.account_name}
                        placeholder="Juan Dela Cruz"
                        className="bg-background"
                    />
                </FormField>
                <FormField
                    id={id('number')}
                    label="Account number"
                    error={error('account_number')}
                >
                    <Input
                        id={id('number')}
                        name={field('account_number')}
                        defaultValue={row.account?.account_number}
                        placeholder="0012 3456 7890"
                        inputMode="numeric"
                        className="bg-background"
                    />
                </FormField>
                <FormField
                    id={id('qr')}
                    label="QR code (optional)"
                    error={error('qr')}
                >
                    <div className="flex items-center gap-3">
                        {row.account?.qr_url && (
                            <img
                                src={row.account.qr_url}
                                alt={`${row.account.bank_name} QR code`}
                                className="size-10 rounded-lg border bg-white object-contain"
                            />
                        )}
                        <Input
                            id={id('qr')}
                            name={field('qr')}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="bg-background"
                        />
                    </div>
                </FormField>
            </div>
        </div>
    );
}

function MethodToggle({
    name,
    icon: Icon,
    title,
    description,
    checked,
    onChange,
    children,
}: {
    name: string;
    icon: LucideIcon;
    title: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    children?: ReactNode;
}) {
    return (
        <div className="rounded-2xl border bg-background">
            <label
                htmlFor={name}
                className="flex cursor-pointer items-start justify-between gap-4 p-4"
            >
                <span className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                        <Icon className="size-4" />
                    </span>
                    <span>
                        <span className="block font-medium">{title}</span>
                        <span className="block text-sm text-muted-foreground">
                            {description}
                        </span>
                    </span>
                </span>
                {/* Unchecked switches send nothing, so post an explicit "off". */}
                <input type="hidden" name={name} value={checked ? '1' : '0'} />
                <Switch
                    id={name}
                    checked={checked}
                    onCheckedChange={onChange}
                    className="data-[state=checked]:bg-brand"
                />
            </label>
            {checked && children && (
                <div className="border-t border-dashed p-4">{children}</div>
            )}
        </div>
    );
}

/**
 * How renters may pay the owner: in person at pickup, by bank transfer that
 * the owner checks, or both. Rendered inside the booking page form.
 */
export function PaymentSettingsSection({
    settings,
    errors,
}: {
    settings: PaymentSettings | null;
    errors: Partial<Record<string, string>>;
}) {
    const [isDownPayment, setIsDownPayment] = useState(
        settings?.down_payment_enabled ?? false,
    );
    const [acceptsPickup, setAcceptsPickup] = useState(
        settings?.accepts_pay_at_pickup ?? true,
    );
    const [acceptsTransfer, setAcceptsTransfer] = useState(
        settings?.accepts_bank_transfer ?? false,
    );
    const [rows, setRows] = useState<AccountRow[]>(() => {
        const saved = (settings?.accounts ?? []).map((account) => ({
            key: `saved-${account.id}`,
            account,
        }));

        return saved.length > 0 ? saved : [{ key: 'new-0', account: null }];
    });

    function addRow(): void {
        setRows((current) => [
            ...current,
            { key: `new-${Date.now()}`, account: null },
        ]);
    }

    function removeRow(key: string): void {
        setRows((current) => current.filter((row) => row.key !== key));
    }

    return (
        <div className="space-y-3">
            <MethodToggle
                name="accepts_pay_at_pickup"
                icon={Banknote}
                title="Pay at pickup"
                description="Renters pay you in cash or GCash when they collect the car."
                checked={acceptsPickup}
                onChange={setAcceptsPickup}
            />
            <InputError message={errors.accepts_pay_at_pickup} />

            <MethodToggle
                name="accepts_bank_transfer"
                icon={Landmark}
                title="Bank transfer"
                description="After you confirm, renters transfer to one of your accounts and send you the reference to check. Add up to 3."
                checked={acceptsTransfer}
                onChange={setAcceptsTransfer}
            >
                <div className="space-y-3">
                    {rows.map((row, index) => (
                        <AccountFields
                            key={row.key}
                            index={index}
                            row={row}
                            errors={errors}
                            onRemove={() => removeRow(row.key)}
                        />
                    ))}
                    <InputError message={errors.accounts} />
                    {rows.length < MAX_ACCOUNTS ? (
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full rounded-2xl border-dashed"
                            onClick={addRow}
                        >
                            <Plus /> Add another account
                            <span className="text-muted-foreground">
                                ({rows.length}/{MAX_ACCOUNTS})
                            </span>
                        </Button>
                    ) : (
                        <p className="text-center text-xs text-muted-foreground">
                            You've added the most accounts ({MAX_ACCOUNTS}).
                        </p>
                    )}
                </div>

                <div className="mt-4 grid gap-4 rounded-2xl border bg-background p-4 sm:grid-cols-2">
                    <div className="space-y-3 sm:col-span-2">
                        <label className="flex cursor-pointer items-start justify-between gap-4">
                            <span>
                                <span className="block text-sm font-medium">
                                    Only ask for a down payment
                                </span>
                                <span className="block text-sm text-muted-foreground">
                                    Renters transfer part of the total to lock
                                    the dates and pay the rest at pickup.
                                </span>
                            </span>
                            {settings?.down_payment_included ? (
                                <Switch
                                    name="down_payment_enabled"
                                    value="1"
                                    checked={isDownPayment}
                                    onCheckedChange={setIsDownPayment}
                                    className="data-[state=checked]:bg-brand"
                                />
                            ) : (
                                <UpgradeNote />
                            )}
                        </label>
                        {isDownPayment && (
                            <FormField
                                id="down_payment_percent"
                                label="Down payment"
                                error={errors.down_payment_percent}
                                hint="Of the booking total, rounded to the peso."
                            >
                                <UnitInput
                                    id="down_payment_percent"
                                    name="down_payment_percent"
                                    defaultValue={
                                        settings?.down_payment_percent ?? 30
                                    }
                                    unit="%"
                                    min={10}
                                    max={90}
                                />
                            </FormField>
                        )}
                    </div>
                    <FormField
                        id="transfer_deadline_minutes"
                        label="Renters pay within"
                        error={errors.transfer_deadline_minutes}
                        hint="After you confirm. If no transfer arrives in time, the booking is cancelled and the dates open up again."
                    >
                        <UnitInput
                            id="transfer_deadline_minutes"
                            name="transfer_deadline_minutes"
                            defaultValue={
                                settings?.transfer_deadline_minutes ?? 60
                            }
                            unit="min"
                            min={5}
                            max={10080}
                        />
                    </FormField>
                </div>
            </MethodToggle>
        </div>
    );
}
