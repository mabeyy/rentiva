import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { BrandButton } from '@/components/public/brand-button';
import { Button } from '@/components/ui/button';
import { dashboard, home } from '@/routes';

const messages: Record<number, { title: string; description: string }> = {
    403: {
        title: "You can't open this page",
        description:
            "Your account doesn't have access to it. If you think it should, ask the business owner or Rentiva support.",
    },
    404: {
        title: "We can't find that page",
        description:
            'The link may be old, or the page was moved or removed. Check the address, or head back.',
    },
    419: {
        title: 'This page expired',
        description:
            'You were away for a while, so the page timed out for your safety. Go back, refresh, and try again.',
    },
    429: {
        title: 'Slow down a little',
        description:
            "That's a lot of tries in a short time. Wait a minute, then try again.",
    },
    500: {
        title: 'Something went wrong on our side',
        description:
            "It's not you. Please try again in a moment, and contact Rentiva support if it keeps happening.",
    },
    503: {
        title: "We'll be right back",
        description:
            "Rentiva is being updated. It usually takes a few minutes; nothing you've saved is lost.",
    },
};

/**
 * Shown for not found, expired, forbidden and server errors, with a way back.
 */
export default function ErrorPage({ status }: { status: number }) {
    const { auth } = usePage().props;
    const message = messages[status] ?? messages[500];

    return (
        <>
            <Head title={message.title} />

            <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center">
                <p className="font-display text-7xl font-extrabold tracking-tight text-brand tabular-nums">
                    {status}
                </p>
                <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">
                    {message.title}
                </h1>
                <p className="mt-3 text-muted-foreground">
                    {message.description}
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Button
                        variant="outline"
                        className="rounded-full px-5"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft /> Go back
                    </Button>
                    <BrandButton className="rounded-full px-5" asChild>
                        <Link href={auth.user ? dashboard() : home()}>
                            {auth.user ? 'Go to dashboard' : 'Go to home page'}
                        </Link>
                    </BrandButton>
                </div>
            </section>
        </>
    );
}
