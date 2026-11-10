import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageLightbox } from '@/components/image-lightbox';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/lib/utils';

/** The parts of a transfer account renters see. */
export type TransferAccount = {
    bank_name: string;
    account_name: string;
    account_number: string;
    qr_url: string | null;
};

function CopyRow({
    label,
    value,
    compact = false,
}: {
    label: string;
    value: string;
    compact?: boolean;
}) {
    const [copiedText, copy] = useClipboard();
    const isCopied = copiedText === value;

    if (compact) {
        return (
            <div className="flex items-center justify-between gap-3 py-1.5">
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="truncate text-sm font-medium tabular-nums">
                        {value || '–'}
                    </p>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground"
                    tooltip={
                        isCopied ? 'Copied' : `Copy ${label.toLowerCase()}`
                    }
                    disabled={!value}
                    onClick={() => copy(value)}
                >
                    {isCopied ? <Check className="text-brand" /> : <Copy />}
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="truncate font-medium tabular-nums">
                    {value || '–'}
                </p>
            </div>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!value}
                onClick={() => copy(value)}
            >
                {isCopied ? <Check /> : <Copy />}
                {isCopied ? 'Copied' : 'Copy'}
            </Button>
        </div>
    );
}

/**
 * One account renters can transfer to, with copy buttons and the QR code,
 * exactly as it shows on the renter's booking page. The owner's payment
 * settings reuse it as a preview.
 */
export function TransferAccountCard({
    account,
    compact = false,
}: {
    account: TransferAccount;
    /** Tighter rows with icon-only copy buttons, for dialogs. */
    compact?: boolean;
}) {
    return (
        <div
            className={cn(
                'grid gap-4 rounded-2xl border bg-background sm:items-center',
                compact ? 'px-4 py-2' : 'p-4',
                account.qr_url && 'sm:grid-cols-[1fr_auto]',
            )}
        >
            <div className="divide-y">
                <CopyRow
                    label="Bank or e-wallet"
                    value={account.bank_name}
                    compact={compact}
                />
                <CopyRow
                    label="Account name"
                    value={account.account_name}
                    compact={compact}
                />
                <CopyRow
                    label="Account number"
                    value={account.account_number}
                    compact={compact}
                />
            </div>
            {account.qr_url && (
                <ImageLightbox
                    src={account.qr_url}
                    alt={`QR code for ${account.bank_name}`}
                    label="Enlarge QR code"
                    className="mx-auto block rounded-2xl"
                >
                    <img
                        src={account.qr_url}
                        alt={`QR code for ${account.bank_name}`}
                        className="size-36 rounded-2xl border bg-white object-contain p-2"
                    />
                </ImageLightbox>
            )}
        </div>
    );
}
