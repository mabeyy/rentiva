import { Head } from '@inertiajs/react';
import { ClosingCta } from '@/components/landing/closing-cta';
import { FeatureBento } from '@/components/landing/feature-bento';
import { HeroSection } from '@/components/landing/hero-section';
import { InboxComparison } from '@/components/landing/inbox-comparison';
import { LinkShowcase } from '@/components/landing/link-showcase';
import type { PublicPlan } from '@/components/landing/pricing-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { SetupSteps } from '@/components/landing/setup-steps';

/**
 * The main home page, aimed at car rental owners.
 */
export default function Home({
    appHost,
    plans,
}: {
    appHost: string;
    plans: PublicPlan[];
}) {
    return (
        <>
            <Head title="Booking pages for car rental owners" />

            <HeroSection appHost={appHost} />
            <InboxComparison />
            <LinkShowcase appHost={appHost} />
            <FeatureBento />
            <SetupSteps />
            <PricingSection plans={plans} />
            <ClosingCta />
        </>
    );
}
