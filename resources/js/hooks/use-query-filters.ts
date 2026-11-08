import { router } from '@inertiajs/react';
import type { RouteDefinition } from '@/wayfinder';

type FilterValue = string | number | null | undefined;

/**
 * Keep a list page's filters in the URL query string and reload on change.
 */
export function useQueryFilters<
    TFilters extends Partial<Record<string, FilterValue>>,
>(route: RouteDefinition<'get'>, filters: TFilters) {
    function apply(
        changes: Partial<Record<keyof TFilters, FilterValue>>,
    ): void {
        const query = Object.fromEntries(
            Object.entries({ ...filters, ...changes }).filter(
                ([, value]) =>
                    value !== null && value !== undefined && value !== '',
            ),
        );

        router.get(route.url, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    function reset(): void {
        router.get(route.url, {}, { replace: true });
    }

    return { apply, reset };
}
