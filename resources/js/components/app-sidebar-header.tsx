import { usePage } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { NotificationBell } from '@/components/notification-bell';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const workspace = usePage<{ workspace?: { owner_name: string } | null }>()
        .props.workspace;

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="ml-auto flex items-center gap-3">
                {workspace && (
                    <span className="hidden rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground sm:inline">
                        Staff at{' '}
                        <span className="font-medium text-foreground">
                            {workspace.owner_name}
                        </span>
                    </span>
                )}
                <NotificationBell />
            </div>
        </header>
    );
}
