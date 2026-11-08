import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Option } from '@/types';

const ALL = 'all';

/**
 * Tabs that filter a list by status; "All" clears the filter.
 */
export function StatusTabs({
    statuses,
    value,
    onChange,
}: {
    statuses: Option[];
    value: string | null | undefined;
    onChange: (status: string | null) => void;
}) {
    return (
        <Tabs
            value={value ?? ALL}
            onValueChange={(status) => onChange(status === ALL ? null : status)}
        >
            <TabsList className="h-auto flex-wrap">
                <TabsTrigger value={ALL}>All</TabsTrigger>
                {statuses.map((status) => (
                    <TabsTrigger key={status.value} value={status.value}>
                        {status.label}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
}
