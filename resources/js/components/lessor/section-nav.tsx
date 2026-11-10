import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

export type PageSection = { id: string; label: string };

/**
 * The section being read: the last one whose top has scrolled near the top
 * of the screen, or the final one once the page is scrolled to the bottom
 * (only after some scrolling, so a short page starts on the first).
 */
function useCurrentSection(ids: string[]): string {
    const [current, setCurrent] = useState(ids[0]);

    useEffect(() => {
        function update(): void {
            const atBottom =
                window.scrollY > 0 &&
                window.innerHeight + window.scrollY >=
                    document.documentElement.scrollHeight - 4;

            if (atBottom) {
                setCurrent(ids[ids.length - 1]);

                return;
            }

            const passed = ids.filter((id) => {
                const top = document
                    .getElementById(id)
                    ?.getBoundingClientRect().top;

                return top !== undefined && top <= 160;
            });
            setCurrent(passed[passed.length - 1] ?? ids[0]);
        }

        update();
        window.addEventListener('scroll', update, { passive: true });

        return () => window.removeEventListener('scroll', update);
    }, [ids]);

    return current;
}

/** Glide to a section (or jump, for people who prefer less motion). */
function scrollToSection(id: string): void {
    const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
    ).matches;

    document.getElementById(id)?.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
    });
    window.history.replaceState(window.history.state, '', `#${id}`);
}

/**
 * An "On this page" menu for a long form: glides to each section and
 * highlights the one being read. Sticks to the top on large screens.
 */
export function SectionNav({
    sections,
    className,
}: {
    sections: readonly PageSection[];
    className?: string;
}) {
    // Re-measure only when the list of sections changes, not every render.
    const idsKey = sections.map((section) => section.id).join(' ');
    const ids = useMemo(() => idsKey.split(' '), [idsKey]);
    const current = useCurrentSection(ids);

    return (
        <nav
            aria-label="Sections"
            className={cn(
                'hidden rounded-3xl border bg-background p-3 lg:sticky lg:top-6 lg:block',
                className,
            )}
        >
            <p className="px-2 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                On this page
            </p>
            <ul>
                {sections.map((section) => (
                    <li key={section.id}>
                        <a
                            href={`#${section.id}`}
                            onClick={(event) => {
                                event.preventDefault();
                                scrollToSection(section.id);
                            }}
                            aria-current={
                                current === section.id ? 'location' : undefined
                            }
                            className={cn(
                                'flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm transition-colors hover:bg-muted/60',
                                current === section.id
                                    ? 'bg-muted font-medium text-foreground'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {section.label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
