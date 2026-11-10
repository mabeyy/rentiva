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

/** Three steps from sign-up to the first request, side by side. */
export function SetupSteps() {
    return (
        <section className="bg-paper">
            <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                <div>
                    <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
                        How it works
                    </p>
                    <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                        Live by this afternoon.
                    </h2>
                    <p className="mt-3 max-w-md text-lg text-muted-foreground">
                        No developer, no app to install, no payment setup. If
                        you can post on Facebook, you can do this.
                    </p>
                </div>

                <ol className="grid gap-4">
                    {steps.map(
                        ({ icon: Icon, title, time, description }, index) => (
                            <li
                                key={title}
                                className="flex gap-4 rounded-2xl border bg-background p-5"
                            >
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 font-display text-sm font-bold text-brand">
                                    {index + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                                            <Icon className="size-5 text-brand" />
                                            {title}
                                        </h3>
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {time}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
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
