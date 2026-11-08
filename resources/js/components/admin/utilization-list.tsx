import type { BodyTypeUtilization } from '@/types';

/**
 * Share of the next 7 days already reserved, per car type.
 */
export function UtilizationList({ items }: { items: BodyTypeUtilization[] }) {
    if (items.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">No listed cars yet.</p>
        );
    }

    return (
        <ul className="space-y-3">
            {items.map((item) => (
                <li key={item.body_type} className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span>{item.body_type}</span>
                        <span className="font-medium tabular-nums">
                            {item.utilization}%
                        </span>
                    </div>
                    <div
                        className="h-2 overflow-hidden rounded-full bg-muted"
                        role="meter"
                        aria-label={`${item.body_type} utilization`}
                        aria-valuenow={item.utilization}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div
                            className="h-full rounded-full bg-chart-1"
                            style={{
                                width: `${Math.min(item.utilization, 100)}%`,
                            }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}
