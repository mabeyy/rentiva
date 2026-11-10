import {
    Banknote,
    ChevronUp,
    Expand,
    Eye,
    Landmark,
    Pencil,
    Plus,
    Trash2,
    Upload,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TransferAccountCard } from '@/components/bookings/transfer-account-card';
import { FormField } from '@/components/form-field';
import { ImageLightbox } from '@/components/image-lightbox';
import { FormSection } from '@/components/lessor/form-section';
import { InfoTip } from '@/components/info-tip';
import { OptionSelect } from '@/components/option-select';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UpgradeNote } from '@/components/lessor/upgrade-note';
import { UnitInput } from '@/components/unit-input';
import { cn } from '@/lib/utils';

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

/**
 * The account's QR code at the end of the row, doubling as the upload:
 * click to pick a QR (or replace it), or the corner button to see it full
 * size. It spans both rows of fields and never changes size.
 */
function QrUpload({
    id,
    name,
    savedSrc,
    previewSrc,
    hasError,
    onPick,
    className,
}: {
    id: string;
    name: string;
    savedSrc: string | null;
    previewSrc: string | null;
    hasError: boolean;
    onPick: (file: File | null) => void;
    className?: string;
}) {
    const src = previewSrc ?? savedSrc;
    const label = src
        ? previewSrc
            ? 'New QR code, not saved yet. Click to replace.'
            : 'QR code renters scan to pay. Click to replace.'
        : 'Upload the QR code renters scan to pay';

    return (
        <label
            htmlFor={id}
            title={label}
            className={cn(
                className,
                'group relative flex size-[8.5rem] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border bg-white transition-colors focus-within:ring-2 focus-within:ring-ring/50',
                !src &&
                    'flex-col border-dashed bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                previewSrc && 'ring-2 ring-brand/50',
                hasError && 'border-destructive text-destructive',
            )}
        >
            {src ? (
                <>
                    <img
                        src={src}
                        alt={previewSrc ? 'New QR code' : 'Current QR code'}
                        className="size-full object-contain"
                    />
                    {/* Keep the click from reaching the label, which would open the file picker. */}
                    <span
                        className="absolute top-1.5 right-1.5"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <ImageLightbox
                            src={src}
                            alt={previewSrc ? 'New QR code' : 'Current QR code'}
                            label="Enlarge QR code"
                            className="flex size-7 items-center justify-center rounded-full bg-ink/70 text-ink-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        >
                            <Expand className="size-3.5" />
                        </ImageLightbox>
                    </span>
                    <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-1 text-center text-xs font-medium text-ink-foreground opacity-0 transition-opacity group-hover:opacity-100">
                        {previewSrc
                            ? 'New · click to replace'
                            : 'Click to replace'}
                    </span>
                </>
            ) : (
                <>
                    <Upload className="size-5" />
                    <span className="mt-1 text-xs font-medium">Upload QR</span>
                    <span className="text-[11px]">Required</span>
                </>
            )}
            <input
                id={id}
                name={name}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required={!savedSrc}
                aria-label={label}
                className="sr-only"
                onChange={(event) => onPick(event.target.files?.[0] ?? null)}
            />
        </label>
    );
}

/** Common Philippine banks and e-wallets, for the bank picker. */
const banks = [
    'GCash',
    'Maya',
    'BDO',
    'BPI',
    'Metrobank',
    'UnionBank',
    'Landbank',
    'Security Bank',
    'RCBC',
    'PNB',
    'China Bank',
    'GoTyme',
    'SeaBank',
];

const OTHER_BANK = '__other__';

/** 45 → "45 minutes", 90 → "1 hour 30 minutes", 1440 → "1 day". */
function spellMinutes(minutes: number): string {
    const plural = (count: number, unit: string) =>
        `${count} ${unit}${count === 1 ? '' : 's'}`;
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const rest = minutes % 60;

    return [
        days && plural(days, 'day'),
        hours && plural(hours, 'hour'),
        rest && plural(rest, 'minute'),
    ]
        .filter(Boolean)
        .join(' ');
}

/** "0012 3456 7890" → "•••• 7890". */
function maskNumber(number: string): string {
    const digits = number.replace(/\s+/g, '');

    return digits.length > 4 ? `•••• ${digits.slice(-4)}` : number;
}

/**
 * One transfer account. Saved accounts show as a single summary line
 * (bank, name, last digits, QR) with Edit; new accounts, accounts being
 * edited and accounts with errors open into fields, with a preview of how
 * renters will see them. The values always submit, open or not.
 */
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
    const hasErrors = [
        'bank_name',
        'account_name',
        'account_number',
        'qr',
    ].some((name) => error(name));

    const [bankName, setBankName] = useState(row.account?.bank_name ?? '');
    const [accountName, setAccountName] = useState(
        row.account?.account_name ?? '',
    );
    const [accountNumber, setAccountNumber] = useState(
        row.account?.account_number ?? '',
    );
    const [isOtherBank, setIsOtherBank] = useState(
        bankName !== '' && !banks.includes(bankName),
    );
    const [isEditing, setIsEditing] = useState(row.account === null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [qrPreview, setQrPreview] = useState<string | null>(null);
    const savedQr = row.account?.qr_url ?? null;
    const [shownSavedQr, setShownSavedQr] = useState(savedQr);
    // An account without a QR stays open, so the required upload is on screen.
    const isOpen = isEditing || hasErrors || (qrPreview ?? savedQr) === null;

    // Once saved, the account has a new QR address: show that, not the preview.
    if (shownSavedQr !== savedQr) {
        setShownSavedQr(savedQr);
        setQrPreview(null);
        setIsEditing(false);
    }

    // Free the previewed file's memory when it changes or the row goes away.
    useEffect(
        () => () => {
            if (qrPreview) {
                URL.revokeObjectURL(qrPreview);
            }
        },
        [qrPreview],
    );

    const qrSrc = qrPreview ?? savedQr;

    return (
        <div className={cn('p-4', isOpen && 'bg-muted/20')}>
            {row.account && (
                <input
                    type="hidden"
                    name={field('id')}
                    value={row.account.id}
                />
            )}

            {!isOpen && (
                <>
                    <input
                        type="hidden"
                        name={field('bank_name')}
                        value={bankName}
                    />
                    <input
                        type="hidden"
                        name={field('account_name')}
                        value={accountName}
                    />
                    <input
                        type="hidden"
                        name={field('account_number')}
                        value={accountNumber}
                    />
                    <div className="flex items-center gap-4">
                        {qrSrc && (
                            <ImageLightbox
                                src={qrSrc}
                                alt={`${bankName} QR code`}
                                label="Enlarge QR code"
                                className="block size-14 shrink-0 overflow-hidden rounded-xl border bg-white"
                            >
                                <img
                                    src={qrSrc}
                                    alt={`${bankName} QR code`}
                                    className="size-full object-contain"
                                />
                            </ImageLightbox>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{bankName}</p>
                            <p className="truncate text-sm text-muted-foreground">
                                {accountName} ·{' '}
                                <span className="tabular-nums">
                                    {maskNumber(accountNumber)}
                                </span>
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => setIsEditing(true)}
                        >
                            <Pencil /> Edit
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            tooltip="Remove account"
                            aria-label={`Remove ${bankName || 'account'}`}
                            onClick={onRemove}
                        >
                            <Trash2 />
                        </Button>
                    </div>
                </>
            )}

            {isOpen && (
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] sm:items-start">
                        <FormField
                            id={id('bank')}
                            label="Bank or e-wallet"
                            error={error('bank_name')}
                        >
                            <OptionSelect
                                id={id('bank')}
                                options={[
                                    ...banks.map((bank) => ({
                                        value: bank,
                                        label: bank,
                                    })),
                                    { value: OTHER_BANK, label: 'Other…' },
                                ]}
                                value={
                                    isOtherBank ? OTHER_BANK : bankName || null
                                }
                                onChange={(value) => {
                                    if (value === OTHER_BANK) {
                                        setIsOtherBank(true);
                                        setBankName('');
                                    } else {
                                        setIsOtherBank(false);
                                        setBankName(value ?? '');
                                    }
                                }}
                                placeholder="Choose a bank or e-wallet"
                                className="bg-background"
                            />
                            {isOtherBank ? (
                                <Input
                                    name={field('bank_name')}
                                    value={bankName}
                                    onChange={(event) =>
                                        setBankName(event.target.value)
                                    }
                                    placeholder="Name of the bank or e-wallet"
                                    aria-label="Name of the bank or e-wallet"
                                    className="mt-2 bg-background"
                                    autoFocus
                                />
                            ) : (
                                <input
                                    type="hidden"
                                    name={field('bank_name')}
                                    value={bankName}
                                />
                            )}
                        </FormField>
                        <FormField
                            id={id('name')}
                            label="Account name"
                            error={error('account_name')}
                        >
                            <Input
                                id={id('name')}
                                name={field('account_name')}
                                value={accountName}
                                onChange={(event) =>
                                    setAccountName(event.target.value)
                                }
                                placeholder="Juan Dela Cruz"
                                className="bg-background"
                            />
                        </FormField>
                        <FormField
                            id={id('number')}
                            label="Account number"
                            error={error('account_number')}
                            className="sm:col-start-1 sm:col-end-3 sm:row-start-2"
                        >
                            <Input
                                id={id('number')}
                                name={field('account_number')}
                                value={accountNumber}
                                onChange={(event) =>
                                    setAccountNumber(event.target.value)
                                }
                                placeholder="0012 3456 7890"
                                inputMode="numeric"
                                className="bg-background"
                            />
                        </FormField>
                        <QrUpload
                            id={id('qr')}
                            name={field('qr')}
                            savedSrc={savedQr}
                            previewSrc={qrPreview}
                            hasError={Boolean(error('qr'))}
                            className="sm:col-start-3 sm:row-span-2 sm:row-start-1"
                            onPick={(file) =>
                                setQrPreview(
                                    file ? URL.createObjectURL(file) : null,
                                )
                            }
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="justify-self-end text-muted-foreground hover:text-destructive sm:col-start-4 sm:row-span-2 sm:row-start-1"
                            tooltip="Remove account"
                            aria-label={`Remove account ${index + 1}`}
                            onClick={onRemove}
                        >
                            <Trash2 />
                        </Button>
                    </div>
                    <InputError message={error('qr')} />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-full"
                            onClick={() => setIsPreviewing((open) => !open)}
                        >
                            <Eye />
                            {isPreviewing
                                ? 'Hide renter preview'
                                : 'How renters see it'}
                        </Button>
                        {row.account && !hasErrors && qrSrc && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-full"
                                onClick={() => setIsEditing(false)}
                            >
                                <ChevronUp /> Done
                            </Button>
                        )}
                    </div>
                    {isPreviewing && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                                What renters see on their booking page when they
                                pay by transfer:
                            </p>
                            <TransferAccountCard
                                account={{
                                    bank_name: bankName,
                                    account_name: accountName,
                                    account_number: accountNumber,
                                    qr_url: qrSrc,
                                }}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/** One way to pay, as a card that switches on and off. */
function MethodTile({
    name,
    icon: Icon,
    title,
    description,
    checked,
    onChange,
}: {
    name: string;
    icon: LucideIcon;
    title: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label
            htmlFor={name}
            className={cn(
                'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors hover:border-foreground/30',
                checked && 'border-brand/60 bg-brand/5 hover:border-brand/60',
            )}
        >
            <span
                className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors',
                    checked && 'bg-brand text-brand-foreground',
                )}
            >
                <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block font-medium">{title}</span>
                <span className="block text-sm text-muted-foreground">
                    {description}
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
    );
}

/**
 * Form rows for the saved accounts, or one empty row when there are none.
 * `version` goes in the keys so rows start fresh (folded) after a save.
 */
function rowsFrom(accounts: PaymentAccount[], version = 0): AccountRow[] {
    const saved = accounts.map((account) => ({
        key: version
            ? `saved-${account.id}-v${version}`
            : `saved-${account.id}`,
        account,
    }));

    return saved.length > 0 ? saved : [{ key: 'new-0', account: null }];
}

/**
 * How renters may pay the owner: in person at pickup, by bank transfer that
 * the owner checks, or both. Rendered inside the booking page form.
 */
export function PaymentSettingsSection({
    settings,
    errors,
    acceptsTransfer,
    onAcceptsTransferChange,
}: {
    settings: PaymentSettings | null;
    errors: Partial<Record<string, string>>;
    /** Whether bank transfer is on; the page keeps it for its section menu. */
    acceptsTransfer: boolean;
    onAcceptsTransferChange: (accepts: boolean) => void;
}) {
    const [isDownPayment, setIsDownPayment] = useState(
        settings?.down_payment_enabled ?? false,
    );
    const [deadlineMinutes, setDeadlineMinutes] = useState<number | null>(
        settings?.transfer_deadline_minutes ?? 60,
    );
    const [acceptsPickup, setAcceptsPickup] = useState(
        settings?.accepts_pay_at_pickup ?? true,
    );
    const [rows, setRows] = useState<AccountRow[]>(() =>
        rowsFrom(settings?.accounts ?? []),
    );
    const savedAccountsKey = JSON.stringify(settings?.accounts ?? []);
    const [shownAccountsKey, setShownAccountsKey] = useState(savedAccountsKey);
    const [rowsVersion, setRowsVersion] = useState(0);

    // After a save the server returns the accounts with their ids: rebuild
    // the rows from them, so a second save updates instead of duplicating.
    // A failed save returns the same accounts, keeping what was typed.
    if (shownAccountsKey !== savedAccountsKey) {
        setShownAccountsKey(savedAccountsKey);
        setRowsVersion(rowsVersion + 1);
        setRows(rowsFrom(settings?.accounts ?? [], rowsVersion + 1));
    }

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
        <>
            <FormSection
                id="methods"
                title="How renters pay"
                description="Turn on one or both. Renters choose when they book."
            >
                <div className="grid gap-3 md:grid-cols-2">
                    <MethodTile
                        name="accepts_pay_at_pickup"
                        icon={Banknote}
                        title="Pay at pickup"
                        description="Cash or GCash when they collect the car. Nothing to set up."
                        checked={acceptsPickup}
                        onChange={setAcceptsPickup}
                    />
                    <MethodTile
                        name="accepts_bank_transfer"
                        icon={Landmark}
                        title="Bank transfer"
                        description="After you confirm, they transfer to your account and send the reference for you to check."
                        checked={acceptsTransfer}
                        onChange={onAcceptsTransferChange}
                    />
                </div>
                {!acceptsPickup && !acceptsTransfer && (
                    <p className="mt-3 text-sm font-medium text-amber-700 dark:text-amber-400">
                        Turn on at least one so renters can book.
                    </p>
                )}
                <InputError
                    message={errors.accepts_pay_at_pickup}
                    className="mt-2"
                />
            </FormSection>

            {acceptsTransfer && (
                <>
                    <FormSection
                        id="accounts"
                        title="Transfer accounts"
                        description={`Where renters send the money. Add up to ${MAX_ACCOUNTS}, each with the QR code they scan.`}
                    >
                        <div className="divide-y overflow-hidden rounded-2xl border bg-background">
                            {rows.map((row, index) => (
                                <AccountFields
                                    key={row.key}
                                    index={index}
                                    row={row}
                                    errors={errors}
                                    onRemove={() => removeRow(row.key)}
                                />
                            ))}
                            {rows.length < MAX_ACCOUNTS ? (
                                <button
                                    type="button"
                                    onClick={addRow}
                                    className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                                >
                                    <Plus className="size-4" /> Add another
                                    account
                                    <span className="ml-auto text-xs font-normal tabular-nums">
                                        {rows.length} of {MAX_ACCOUNTS}
                                    </span>
                                </button>
                            ) : (
                                <p className="px-4 py-3 text-xs text-muted-foreground">
                                    You've added the most accounts (
                                    {MAX_ACCOUNTS}).
                                </p>
                            )}
                        </div>
                        <InputError
                            message={errors.accounts}
                            className="mt-2"
                        />
                    </FormSection>

                    <FormSection
                        id="rules"
                        title="Transfer rules"
                        description="How long renters have to pay, and how much they send."
                    >
                        <div className="grid gap-6 sm:grid-cols-2">
                            <FormField
                                id="transfer_deadline_minutes"
                                label="Renters pay within"
                                error={errors.transfer_deadline_minutes}
                                hint={
                                    deadlineMinutes
                                        ? `${spellMinutes(deadlineMinutes)} from when you confirm.`
                                        : 'Counted from when you confirm.'
                                }
                                info="The timer starts when you confirm the booking. If no transfer reference arrives in time, the booking is cancelled on its own and the dates open up for other renters. 60 minutes suits most bookings; allow longer for renters who book days ahead."
                            >
                                <UnitInput
                                    id="transfer_deadline_minutes"
                                    name="transfer_deadline_minutes"
                                    defaultValue={
                                        settings?.transfer_deadline_minutes ??
                                        60
                                    }
                                    unit="min"
                                    min={5}
                                    max={10080}
                                    onValueChange={setDeadlineMinutes}
                                />
                            </FormField>
                            <div className="grid content-start gap-2">
                                <div className="flex min-h-4 items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        <Label htmlFor="down_payment_enabled">
                                            Only ask for a down payment
                                        </Label>
                                        <InfoTip>
                                            Renters transfer part of the total
                                            after you confirm, to hold the car,
                                            and pay the rest at pickup.
                                        </InfoTip>
                                    </div>
                                    {settings?.down_payment_included ? (
                                        <Switch
                                            id="down_payment_enabled"
                                            name="down_payment_enabled"
                                            value="1"
                                            checked={isDownPayment}
                                            onCheckedChange={setIsDownPayment}
                                            className="data-[state=checked]:bg-brand"
                                        />
                                    ) : (
                                        <UpgradeNote />
                                    )}
                                </div>
                                {isDownPayment ? (
                                    <>
                                        <UnitInput
                                            id="down_payment_percent"
                                            name="down_payment_percent"
                                            defaultValue={
                                                settings?.down_payment_percent ??
                                                30
                                            }
                                            unit="%"
                                            min={10}
                                            max={90}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Of the booking total, rounded to the
                                            peso.
                                        </p>
                                        <InputError
                                            message={
                                                errors.down_payment_percent
                                            }
                                        />
                                    </>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        Off: renters transfer the full amount.
                                    </p>
                                )}
                            </div>
                        </div>
                    </FormSection>
                </>
            )}
        </>
    );
}
