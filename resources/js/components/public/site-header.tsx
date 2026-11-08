import { Link, usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import { BrandButton } from '@/components/public/brand-button';
import { SiteLogo } from '@/components/public/site-logo';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useHasScrolled } from '@/hooks/use-has-scrolled';
import { cn } from '@/lib/utils';
import { dashboard, home, login, register, rent } from '@/routes';
import bookings from '@/routes/bookings';

const links = [
    { title: 'Pricing', href: `${home().url}#pricing` },
    { title: 'Rent a car', href: rent() },
    { title: 'Find my booking', href: bookings.lookup() },
];

function AccountActions({ stacked = false }: { stacked?: boolean }) {
    const { auth } = usePage().props;

    if (auth.user) {
        return (
            <BrandButton
                className={cn('rounded-full px-5', stacked && 'w-full')}
                asChild
            >
                <Link href={dashboard()}>Dashboard</Link>
            </BrandButton>
        );
    }

    return (
        <>
            <Button
                variant="ghost"
                className={cn('rounded-full', stacked && 'w-full')}
                asChild
            >
                <Link href={login()}>Log in</Link>
            </Button>
            <BrandButton
                className={cn('rounded-full px-5', stacked && 'w-full')}
                asChild
            >
                <Link href={register()}>Get your booking page</Link>
            </BrandButton>
        </>
    );
}

export function SiteHeader() {
    const hasScrolled = useHasScrolled();
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <header
            className={cn(
                'sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300',
                hasScrolled
                    ? 'border-border/60 bg-paper/80 shadow-[0_8px_30px_-20px_rgb(0_0_0/0.25)] backdrop-blur-lg'
                    : 'border-transparent bg-paper',
            )}
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6">
                <Link href={home()} aria-label="Home">
                    <SiteLogo />
                </Link>

                <nav className="hidden items-center gap-1 md:flex">
                    {links.map((link) => (
                        <Link
                            key={link.title}
                            href={link.href}
                            prefetch
                            className={cn(
                                'rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground',
                                isCurrentUrl(link.href) &&
                                    'bg-foreground/5 text-foreground',
                            )}
                        >
                            {link.title}
                        </Link>
                    ))}
                </nav>

                <div className="ml-auto hidden items-center gap-2 md:flex">
                    <AccountActions />
                </div>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto rounded-full md:hidden"
                            aria-label="Open menu"
                        >
                            <Menu />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-72 bg-paper">
                        <SheetHeader>
                            <SheetTitle>
                                <SiteLogo />
                            </SheetTitle>
                        </SheetHeader>
                        <nav className="flex flex-col gap-1 px-4">
                            {links.map((link) => (
                                <Link
                                    key={link.title}
                                    href={link.href}
                                    className="rounded-lg px-3 py-2.5 font-medium hover:bg-foreground/5"
                                >
                                    {link.title}
                                </Link>
                            ))}
                            <div className="mt-4 flex flex-col gap-2">
                                <AccountActions stacked />
                            </div>
                        </nav>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
}
