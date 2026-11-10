import { Head, router } from '@inertiajs/react';
import { Check, Inbox, Mail, RotateCcw } from 'lucide-react';
import SupportRequestController from '@/actions/App/Http/Controllers/Admin/SupportRequestController';
import { EmptyState } from '@/components/empty-state';
import Heading from '@/components/heading';
import { ImageLightbox } from '@/components/image-lightbox';
import { PaginationLinks } from '@/components/pagination-links';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQueryFilters } from '@/hooks/use-query-filters';
import admin from '@/routes/admin';
import type { Paginated } from '@/types';
import { TimeAgo } from '@/components/time-ago';

type HelpRequest = {
    id: number;
    topic: string;
    reference: string | null;
    message: string;
    has_screenshot: boolean;
    sender: { name: string; email: string; business: string | null };
    created_at: string;
    resolved_at: string | null;
};

function RequestCard({ request }: { request: HelpRequest }) {
    const screenshotUrl = SupportRequestController.screenshot.url(request.id);
    const replySubject = encodeURIComponent(
        `Re: Help request: ${request.topic}`,
    );

    return (
        <li className="space-y-3 rounded-2xl border bg-background p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-medium">
                        {request.sender.business ?? request.sender.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {request.sender.name} · {request.sender.email}
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2.5 py-0.5 font-medium text-foreground">
                        {request.topic}
                    </span>
                    <TimeAgo date={request.created_at} />
                </div>
            </div>

            {request.reference && (
                <p className="text-sm">
                    <span className="text-muted-foreground">About: </span>
                    {request.reference}
                </p>
            )}
            <p className="text-sm whitespace-pre-line">{request.message}</p>

            {request.has_screenshot && (
                <ImageLightbox
                    src={screenshotUrl}
                    alt={`Screenshot from ${request.sender.name}`}
                    label="Enlarge screenshot"
                    className="block w-fit overflow-hidden rounded-xl border"
                >
                    <img
                        src={screenshotUrl}
                        alt={`Screenshot from ${request.sender.name}`}
                        className="h-28 w-auto bg-muted object-cover"
                    />
                </ImageLightbox>
            )}

            <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
                <Button variant="outline" size="sm" asChild>
                    <a
                        href={`mailto:${request.sender.email}?subject=${replySubject}`}
                    >
                        <Mail /> Reply by email
                    </a>
                </Button>
                {request.resolved_at ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            router.put(
                                SupportRequestController.update.url(request.id),
                                { resolved: false },
                                { preserveScroll: true },
                            )
                        }
                    >
                        <RotateCcw /> Open again
                    </Button>
                ) : (
                    <Button
                        size="sm"
                        onClick={() =>
                            router.put(
                                SupportRequestController.update.url(request.id),
                                { resolved: true },
                                { preserveScroll: true },
                            )
                        }
                    >
                        <Check /> Mark resolved
                    </Button>
                )}
            </div>
        </li>
    );
}

/**
 * Questions owners and staff sent from the Help page. Reply by email, then
 * mark them resolved (which deletes any screenshot).
 */
export default function AdminSupport({
    requests,
    status,
    counts,
}: {
    requests: Paginated<HelpRequest>;
    status: 'open' | 'resolved';
    counts: { open: number; resolved: number };
}) {
    const { apply } = useQueryFilters(admin.support.index(), { status });

    return (
        <>
            <Head title="Help requests" />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Help requests"
                    description="Questions owners and staff send from their Help page. Reply by email, then mark them resolved. Screenshots are deleted once resolved."
                />

                <Tabs
                    value={status}
                    onValueChange={(value) =>
                        apply({ status: value === 'open' ? null : value })
                    }
                >
                    <TabsList>
                        <TabsTrigger value="open">
                            Open ({counts.open})
                        </TabsTrigger>
                        <TabsTrigger value="resolved">
                            Resolved ({counts.resolved})
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {requests.data.length > 0 ? (
                    <ul className="space-y-3">
                        {requests.data.map((request) => (
                            <RequestCard key={request.id} request={request} />
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        icon={Inbox}
                        title={
                            status === 'open'
                                ? 'No open requests'
                                : 'Nothing resolved yet'
                        }
                        description={
                            status === 'open'
                                ? 'New questions from owners show up here.'
                                : 'Requests you mark resolved show up here.'
                        }
                    />
                )}

                <PaginationLinks paginated={requests} />
            </div>
        </>
    );
}

AdminSupport.layout = {
    breadcrumbs: [{ title: 'Help requests', href: admin.support.index() }],
};
