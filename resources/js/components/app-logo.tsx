import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <AppLogoIcon className="size-8 shrink-0" />
            <div className="ml-1 grid flex-1 text-left">
                <span className="truncate font-display text-base leading-tight font-extrabold tracking-tight">
                    {name}
                </span>
            </div>
        </>
    );
}
