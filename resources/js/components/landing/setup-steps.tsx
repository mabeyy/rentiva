import type { LucideIcon } from 'lucide-react';
import { CarFront, Send, Store } from 'lucide-react';

const steps: {
    icon: LucideIcon;
    title: string;
    time: string;
    description: string;
}[] = [
    {
        icon: Store,
        title: 'Name your business',
        time: '~1 min',
        description:
            'Sign up and your booking page address is ready instantly.',
    },
    {
        icon: CarFront,
        title: 'Add your cars',
        time: '~5 min per car',
        description:
            'Photos, specs and your daily rate. We review each listing before it goes live.',
    },
    {
        icon: Send,
        title: 'Share and confirm',
        time: 'Then just share',
        description:
            'Post your link. Requests land in your dashboard and your email.',
    },
];

export function SetupSteps() {
    return (
        <section className="border-t bg-background">
            <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
                <div>
                    <div>
                        <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
                            How it works
                        </p>
                        <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                            Live by this afternoon.
                        </h2>
                        <p className="mt-3 max-w-xl text-lg text-muted-foreground">
                            No developer, no app to install, no payment setup.
                            If you can post on Facebook, you can do this.
                        </p>
                    </div>
                </div>

                <ol className="mt-12 grid gap-6 md:grid-cols-3">
                    {steps.map(
                        ({ icon: Icon, title, time, description }, index) => (
                            <li key={title} className="relative">
                                {index < steps.length - 1 && (
                                    <span
                                        aria-hidden
                                        className="absolute top-5 right-[calc(-50%+0.5rem)] left-[calc(50%+2rem)] hidden border-t-2 border-dashed border-brand/40 md:block"
                                    />
                                )}
                                <span className="relative mx-auto flex size-10 items-center justify-center rounded-full bg-brand font-display text-sm font-bold text-brand-foreground">
                                    {index + 1}
                                </span>
                                <div className="mt-5 rounded-2xl border bg-muted/30 p-5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                                            <Icon className="size-5 text-brand" />{' '}
                                            {title}
                                        </h3>
                                        <span className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                            {time}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {description}
                                    </p>
                                </div>
                            </li>
                        ),
                    )}
                </ol>
            </div>
        </section>
    );
}
