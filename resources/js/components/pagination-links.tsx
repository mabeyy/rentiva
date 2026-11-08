import { router } from '@inertiajs/react';
import type { MouseEvent } from 'react';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import type { Paginated } from '@/types';

function visit(event: MouseEvent<HTMLAnchorElement>, url: string | null): void {
    event.preventDefault();

    if (url) {
        router.visit(url, { preserveScroll: true, preserveState: true });
    }
}

/**
 * shadcn pagination wired to a paginated Laravel resource collection.
 */
export function PaginationLinks({
    paginated,
}: {
    paginated: Pick<Paginated<unknown>, 'links' | 'meta'>;
}) {
    const { links, meta } = paginated;

    if (meta.last_page <= 1) {
        return null;
    }

    // Laravel wraps page links with "Previous" and "Next" entries.
    const pageLinks = meta.links.slice(1, -1);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <p className="text-sm text-muted-foreground">
                Showing {meta.from}–{meta.to} of {meta.total}
            </p>
            <Pagination className="mx-0 w-auto">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            href={links.prev ?? '#'}
                            aria-disabled={!links.prev}
                            className={
                                links.prev
                                    ? undefined
                                    : 'pointer-events-none opacity-50'
                            }
                            onClick={(event) => visit(event, links.prev)}
                        />
                    </PaginationItem>
                    {pageLinks.map((link, index) => (
                        <PaginationItem key={`${link.label}-${index}`}>
                            {link.url ? (
                                <PaginationLink
                                    href={link.url}
                                    isActive={link.active}
                                    onClick={(event) => visit(event, link.url)}
                                >
                                    {link.label}
                                </PaginationLink>
                            ) : (
                                <PaginationEllipsis />
                            )}
                        </PaginationItem>
                    ))}
                    <PaginationItem>
                        <PaginationNext
                            href={links.next ?? '#'}
                            aria-disabled={!links.next}
                            className={
                                links.next
                                    ? undefined
                                    : 'pointer-events-none opacity-50'
                            }
                            onClick={(event) => visit(event, links.next)}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
}
