import type { SVGAttributes } from 'react';

/**
 * The Rentiva mark: a geometric "R" whose leg curves away like a road,
 * on a brand-orange rounded square. Colors are fixed so it reads the same everywhere.
 */
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Rentiva"
            {...props}
        >
            <rect width="32" height="32" rx="9" className="fill-brand" />
            <g
                fill="none"
                stroke="white"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M10.5 24V8.5h6a5 5 0 0 1 0 10h-6" />
                <path d="M15.5 18.5c3.4 0 5.6 1.9 6.8 5.5" />
            </g>
        </svg>
    );
}
