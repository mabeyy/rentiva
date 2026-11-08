/**
 * Serialize structured data for a <script type="application/ld+json"> tag.
 * Inertia inserts head children as raw HTML, so characters that could close
 * the script tag are unicode-escaped (user-controlled names end up here).
 */
export function toJsonLd(data: Record<string, unknown>): string {
    return JSON.stringify(data)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026');
}
