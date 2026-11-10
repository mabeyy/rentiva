import { InfoTip } from '@/components/info-tip';

export type TrafficSource = { source: string | null; visitors: number };

const sourceNames: Record<string, string> = {
    'facebook.com': 'Facebook',
    'messenger.com': 'Messenger',
    'instagram.com': 'Instagram',
    'google.com': 'Google',
    'google.com.ph': 'Google',
    'tiktok.com': 'TikTok',
};

/** "facebook.com" → "Facebook"; no source → direct or chat apps. */
export function sourceName(source: string | null): string {
    if (source === null) {
        return 'Direct or chat apps';
    }

    return sourceNames[source] ?? source;
}

/**
 * Where visitors came from, as a short list with bars sized against the top
 * source. Counts sit in text colour next to each bar.
 */
export function TrafficSources({ sources }: { sources: TrafficSource[] }) {
    const top = Math.max(1, ...sources.map((source) => source.visitors));

    if (sources.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No visits counted yet.
            </p>
        );
    }

    return (
        <ul className="space-y-2.5">
            {sources.map(({ source, visitors }) => (
                <li key={source ?? 'direct'} className="text-sm">
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-1">
                            <span className="truncate">
                                {sourceName(source)}
                            </span>
                            {source === null && (
                                <InfoTip>
                                    Links opened from Messenger, Viber or other
                                    chat apps, or typed in directly, don't say
                                    where the visitor came from.
                                </InfoTip>
                            )}
                        </span>
                        <span className="font-medium tabular-nums">
                            {visitors.toLocaleString()}
                        </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-brand"
                            style={{ width: `${(visitors / top) * 100}%` }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}
