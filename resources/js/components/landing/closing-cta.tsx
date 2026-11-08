import { Link } from '@inertiajs/react';
import { BrandButton } from '@/components/public/brand-button';
import { register, rent } from '@/routes';

/** Fades the photo's left edge into the panel so there is no visible seam. */
const photoFade = 'linear-gradient(to right, transparent 0%, black 45%)';

export function ClosingCta() {
    return (
        <section className="bg-background px-4 pb-16 sm:px-6">
            <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-ink text-ink-foreground">
                <div
                    aria-hidden
                    className="absolute -right-24 -bottom-32 hidden size-[560px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--brand)_35%,transparent),transparent_65%)] md:block"
                />
                <img
                    src="/images/landing/corolla-black.jpg"
                    alt=""
                    style={{ maskImage: photoFade, WebkitMaskImage: photoFade }}
                    className="absolute inset-y-0 right-0 hidden h-full w-[62%] object-cover object-[60%_55%] brightness-110 contrast-110 md:block"
                />

                <div className="relative max-w-2xl px-8 py-14 sm:px-14 sm:py-20">
                    <h2 className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
                        Your next booking could come in{' '}
                        <span className="text-brand">tonight.</span>
                    </h2>
                    <p className="mt-5 max-w-md text-lg text-ink-foreground/70">
                        Set up your page now and share the link before dinner.
                    </p>
                    <BrandButton
                        size="lg"
                        className="mt-8 h-12 px-7 text-base"
                        asChild
                    >
                        <Link href={register()}>Create your booking page</Link>
                    </BrandButton>
                </div>
            </div>
            <p className="mt-10 text-center text-sm text-muted-foreground">
                Looking to rent a car instead?{' '}
                <Link
                    href={rent()}
                    className="font-medium text-foreground underline underline-offset-4"
                >
                    Find a rental company
                </Link>
            </p>
        </section>
    );
}
