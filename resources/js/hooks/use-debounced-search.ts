import { useEffect, useRef, useState } from 'react';

/**
 * A search box's text, applied a moment after the person stops typing so
 * results update without pressing Enter. Picks up outside changes to the
 * value (like "Clear filters") without overwriting what's being typed.
 */
export function useDebouncedSearch(
    value: string | null | undefined,
    onSearch: (search: string) => void,
    delay = 300,
): [string, (search: string) => void] {
    const current = value ?? '';
    const [search, setSearch] = useState(current);
    const lastSent = useRef(current);
    const latestOnSearch = useRef(onSearch);

    useEffect(() => {
        latestOnSearch.current = onSearch;
    }, [onSearch]);

    useEffect(() => {
        if (current !== lastSent.current) {
            lastSent.current = current;
            setSearch(current);
        }
    }, [current]);

    useEffect(() => {
        if (search === lastSent.current) {
            return;
        }

        const timer = window.setTimeout(() => {
            lastSent.current = search;
            latestOnSearch.current(search);
        }, delay);

        return () => window.clearTimeout(timer);
    }, [search, delay]);

    return [search, setSearch];
}
