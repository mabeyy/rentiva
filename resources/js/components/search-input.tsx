import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';
import { cn } from '@/lib/utils';

/**
 * Search box that updates results as you type, a moment after you stop.
 */
export function SearchInput({
    value,
    onSearch,
    placeholder = 'Search…',
    className,
}: {
    value: string | null | undefined;
    onSearch: (search: string) => void;
    placeholder?: string;
    className?: string;
}) {
    const [search, setSearch] = useDebouncedSearch(value, onSearch);

    return (
        <form
            role="search"
            className={cn('relative w-full max-w-sm', className)}
            onSubmit={(event) => event.preventDefault()}
        >
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={placeholder}
                className="pl-9"
            />
        </form>
    );
}
