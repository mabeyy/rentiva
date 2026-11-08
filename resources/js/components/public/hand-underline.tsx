/**
 * The landing page's hand-drawn brush stroke, placed under a `relative inline-block` word.
 */
export function HandUnderline() {
    return (
        <svg
            aria-hidden
            viewBox="0 0 300 18"
            preserveAspectRatio="none"
            className="absolute -bottom-2 left-0 h-3 w-full text-brand"
        >
            <path
                d="M3 13C60 5 140 3 297 9"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
            />
        </svg>
    );
}
