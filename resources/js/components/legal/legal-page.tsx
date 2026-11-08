import { Head } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import type { ReactNode } from 'react';

/**
 * A readable legal document: title, intro and last-updated date, then sections.
 */
export function LegalPage({
    title,
    intro,
    lastUpdated,
    children,
}: {
    title: string;
    intro: string;
    lastUpdated: string;
    children: ReactNode;
}) {
    return (
        <>
            <Head title={title} />

            <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
                <header className="border-b pb-8">
                    <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                        <span
                            aria-hidden
                            className="h-0.5 w-8 rounded-full bg-brand"
                        />
                        Last updated{' '}
                        {format(parseISO(lastUpdated), 'MMMM d, yyyy')}
                    </p>
                    <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                        {title}
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        {intro}
                    </p>
                </header>
                <div className="divide-y">{children}</div>
            </article>
        </>
    );
}

export function LegalSection({
    heading,
    children,
}: {
    heading: string;
    children: ReactNode;
}) {
    return (
        <section className="space-y-3 py-8 leading-relaxed text-muted-foreground">
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
                {heading}
            </h2>
            {children}
        </section>
    );
}

export function LegalList({ items }: { items: ReactNode[] }) {
    return (
        <ul className="list-disc space-y-1.5 pl-5 marker:text-brand">
            {items.map((item, index) => (
                <li key={index}>{item}</li>
            ))}
        </ul>
    );
}

/**
 * "24 months (2 years)" style wording for a retention period in months.
 */
export function describeMonths(months: number): string {
    const label = `${months} ${months === 1 ? 'month' : 'months'}`;

    if (months % 12 !== 0) {
        return label;
    }

    const years = months / 12;

    return `${label} (${years} ${years === 1 ? 'year' : 'years'})`;
}

/** The rights every privacy notice lists under the Data Privacy Act. */
export const dataPrivacyRights = [
    'Be informed about how your personal data is processed.',
    'Access the personal data held about you.',
    'Correct anything that is inaccurate or out of date.',
    'Object to processing, or withdraw consent where it is relied on.',
    'Have your data erased or blocked where it is no longer necessary, or was collected unlawfully.',
    'Receive a copy of your data in a portable electronic format.',
    'Be indemnified for damages caused by inaccurate, incomplete or unlawfully obtained data.',
];
