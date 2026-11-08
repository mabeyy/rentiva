import type { ActivityEvent, ActivityFilters } from '@/pages/lessor/activity';
import { ActivityFeed } from '@/pages/lessor/activity';
import admin from '@/routes/admin';
import type { Option, Paginated } from '@/types';

/**
 * Every owner's booking activity, for the platform admin.
 */
export default function AdminActivity({
    events,
    filters,
    owners,
}: {
    events: Paginated<ActivityEvent>;
    filters: ActivityFilters;
    owners: Option[];
}) {
    return (
        <ActivityFeed
            events={events}
            filters={filters}
            filterRoute={admin.activity()}
            owners={owners}
            description="Every request, confirmation, payment, review and blocked date across all owners, and who did it."
        />
    );
}

AdminActivity.layout = {
    breadcrumbs: [{ title: 'Activity', href: admin.activity() }],
};
