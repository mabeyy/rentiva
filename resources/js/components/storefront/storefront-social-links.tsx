import { Facebook, Instagram } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { cn } from '@/lib/utils';
import type { Storefront } from '@/types';
import { Hint } from '@/components/info-tip';

/** Lucide has no TikTok mark, so draw the note glyph inline. */
function TikTokIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z" />
        </svg>
    );
}

type Network = {
    key: 'facebook_url' | 'instagram_url' | 'tiktok_url';
    label: string;
    icon: ComponentType<{ className?: string }>;
};

const networks: Network[] = [
    { key: 'facebook_url', label: 'Facebook', icon: Facebook },
    { key: 'instagram_url', label: 'Instagram', icon: Instagram },
    { key: 'tiktok_url', label: 'TikTok', icon: TikTokIcon },
];

/**
 * Round icon links to the owner's social pages; renders nothing when none are set.
 */
export function StorefrontSocialLinks({
    storefront,
    className,
    linkClassName,
}: {
    storefront: Storefront;
    className?: string;
    linkClassName?: string;
}) {
    const links = networks.filter(({ key }) => storefront[key]);

    if (links.length === 0) {
        return null;
    }

    return (
        <ul className={cn('flex items-center gap-2', className)}>
            {links.map(({ key, label, icon: Icon }) => (
                <li key={key}>
                    <Hint text={label}>
                        <a
                            href={storefront[key]!}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${storefront.name} on ${label}`}
                            className={cn(
                                'flex size-10 items-center justify-center rounded-full border bg-background transition-colors hover:border-brand hover:text-brand',
                                linkClassName,
                            )}
                        >
                            <Icon className="size-4" />
                        </a>
                    </Hint>
                </li>
            ))}
        </ul>
    );
}
