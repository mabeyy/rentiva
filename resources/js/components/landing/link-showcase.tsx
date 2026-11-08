import {
    Camera,
    Lock,
    MapPin,
    MessageCircle,
    Printer,
    ThumbsUp,
} from 'lucide-react';
import { useTypewriter } from '@/hooks/use-typewriter';

const exampleSlugs = [
    'abqcarrental',
    'cebu-drive',
    'davao-wheels',
    'your-business',
];

const channels = [
    { icon: ThumbsUp, label: 'Facebook' },
    { icon: MessageCircle, label: 'Messenger' },
    { icon: MapPin, label: 'Google Maps' },
    { icon: Camera, label: 'Instagram' },
    { icon: Printer, label: 'Tarpaulins' },
];

/**
 * The one thing an owner walks away with: their own link, in a glowing address bar.
 */
export function LinkShowcase({ appHost }: { appHost: string }) {
    const slug = useTypewriter(exampleSlugs);

    return (
        <section className="relative overflow-hidden bg-ink text-ink-foreground">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,color-mix(in_oklch,var(--brand)_10%,transparent),transparent)]"
            />

            <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 py-24 text-center sm:px-6">
                <p className="text-sm font-semibold tracking-widest text-ink-foreground/60 uppercase">
                    One link. Every channel.
                </p>
                <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                    Your business, one link away.
                </h2>

                <div className="relative mt-12 w-full max-w-3xl">
                    <div
                        aria-hidden
                        className="absolute inset-x-8 -inset-y-2 rounded-full bg-brand/12 blur-3xl"
                    />
                    <div className="relative rounded-full bg-gradient-to-r from-ink-foreground/10 via-brand/50 to-ink-foreground/10 p-px">
                        <div className="flex items-center gap-3 rounded-full bg-ink px-5 py-4 shadow-[inset_0_1px_0_color-mix(in_oklch,var(--ink-foreground)_12%,transparent)] sm:px-8 sm:py-5">
                            <Lock
                                aria-hidden
                                className="size-5 shrink-0 text-ink-foreground/40"
                            />
                            <span className="sr-only">
                                {appHost}/your-business
                            </span>
                            <p
                                aria-hidden
                                className="min-w-0 truncate text-left font-display text-2xl font-bold tracking-tight sm:text-4xl"
                            >
                                <span className="text-ink-foreground/40">
                                    {appHost}/
                                </span>
                                <span className="text-brand">{slug}</span>
                                <span className="ml-0.5 inline-block h-[0.9em] w-[3px] translate-y-[0.12em] animate-pulse rounded-full bg-brand" />
                            </p>
                        </div>
                    </div>
                </div>

                <p className="mt-10 max-w-xl text-lg text-ink-foreground/70">
                    Your logo, your fleet, your number, and nobody else's cars.
                    Share it wherever renters find you.
                </p>
                <ul className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-ink-foreground/80">
                    {channels.map(({ icon: Icon, label }) => (
                        <li key={label} className="flex items-center gap-2">
                            <Icon className="size-4 text-brand" /> {label}
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
