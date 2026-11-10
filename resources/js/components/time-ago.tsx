import {
    format,
    formatDistanceToNow,
    formatDistanceToNowStrict,
    parseISO,
} from 'date-fns';

/**
 * "3 hours ago" for an ISO date, with the exact time on hover. The server
 * and the browser work it out a moment apart, so the text may differ by a
 * second; that's expected and not a hydration error.
 */
export function TimeAgo({
    date,
    strict = false,
    className,
}: {
    date: string;
    /** "3 hours ago" instead of "about 3 hours ago". */
    strict?: boolean;
    className?: string;
}) {
    const parsed = parseISO(date);
    const text = strict
        ? formatDistanceToNowStrict(parsed, { addSuffix: true })
        : formatDistanceToNow(parsed, { addSuffix: true });

    return (
        <time
            dateTime={date}
            title={format(parsed, 'MMM d, yyyy h:mm a')}
            className={className}
            suppressHydrationWarning
        >
            {text}
        </time>
    );
}
