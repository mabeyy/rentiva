import { Search } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Search box that applies on Enter or blur, not on every keystroke.
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
    const [search, setSearch] = useState(value ?? '');

    return (
        <form
            role="search"
            className={cn('relative w-full max-w-sm', className)}
            onSubmit={(event) => {
                event.preventDefault();
                onSearch(search);
            }}
        >
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onBlur={() => search !== (value ?? '') && onSearch(search)}
                placeholder={placeholder}
                className="pl-9"
            />
        </form>
    );
}
