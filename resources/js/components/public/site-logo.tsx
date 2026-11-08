import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';

/**
 * Public-site wordmark: the Rentiva mark and the name in the display face.
 */
export function SiteLogo() {
    const { name } = usePage().props;

    return (
        <span className="flex items-center gap-2">
            <AppLogoIcon
                aria-hidden
                className="size-8 drop-shadow-[0_6px_10px_color-mix(in_oklch,var(--brand)_45%,transparent)]"
            />
            <span className="font-display text-xl font-extrabold tracking-tight">
                {name}
            </span>
        </span>
    );
}
