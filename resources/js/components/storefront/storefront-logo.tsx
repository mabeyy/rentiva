import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { brandColorStyle } from '@/lib/brand-color';
import { cn } from '@/lib/utils';
import type { Storefront } from '@/types';

export function StorefrontLogo({
    storefront,
    className,
}: {
    storefront: Storefront;
    className?: string;
}) {
    const getInitials = useInitials();

    return (
        <Avatar className={cn('size-10 rounded-lg', className)}>
            {storefront.logo_url && (
                <AvatarImage
                    src={storefront.logo_url}
                    alt={`${storefront.name} logo`}
                    className="object-cover"
                />
            )}
            <AvatarFallback
                style={brandColorStyle(storefront.brand_color)}
                className="rounded-[inherit] bg-brand font-display font-bold text-brand-foreground"
            >
                {getInitials(storefront.name)}
            </AvatarFallback>
        </Avatar>
    );
}
