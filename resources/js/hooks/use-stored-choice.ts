import { useEffect, useState } from 'react';

/**
 * A small per-browser preference (e.g. grid vs list) kept in localStorage.
 * Starts at `fallback` so server and first client render match, then loads
 * the stored value; storage errors (private mode) just fall back.
 */
export function useStoredChoice<T extends string>(
    key: string,
    choices: readonly T[],
    fallback: T,
): [T, (choice: T) => void] {
    const [choice, setChoice] = useState<T>(fallback);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(key) as T | null;

            if (stored && choices.includes(stored)) {
                setChoice(stored);
            }
        } catch {
            // Storage unavailable: keep the fallback.
        }
    }, [key, choices]);

    function update(next: T): void {
        setChoice(next);

        try {
            localStorage.setItem(key, next);
        } catch {
            // Storage unavailable: the choice still applies for this visit.
        }
    }

    return [choice, update];
}
