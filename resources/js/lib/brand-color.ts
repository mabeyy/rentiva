import type { CSSProperties } from 'react';

/** Owner-pickable presets, each dark enough for white button text. */
export const brandColorPresets: { name: string; value: string }[] = [
    { name: 'Sunset', value: '#E8622A' },
    { name: 'Crimson', value: '#C62839' },
    { name: 'Berry', value: '#B0306A' },
    { name: 'Violet', value: '#6D3FD1' },
    { name: 'Ocean', value: '#1D63D8' },
    { name: 'Teal', value: '#0E8077' },
    { name: 'Forest', value: '#2F7D32' },
    { name: 'Graphite', value: '#2B2F36' },
];

const DARK_TEXT = '#1C1A17';
const LIGHT_TEXT = '#FFFFFF';

function relativeLuminance(hex: string): number {
    const [red, green, blue] = [1, 3, 5].map((offset) => {
        const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;

        return channel <= 0.03928
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4;
    });

    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/**
 * White or near-black, whichever reads better on the given color (WCAG contrast).
 */
export function readableTextOn(hex: string): string {
    const luminance = relativeLuminance(hex);
    const contrastWithWhite = 1.05 / (luminance + 0.05);
    const contrastWithDark =
        (luminance + 0.05) / (relativeLuminance(DARK_TEXT) + 0.05);

    return contrastWithWhite >= contrastWithDark ? LIGHT_TEXT : DARK_TEXT;
}

/**
 * CSS variables that swap the app's brand color for an owner's own, or
 * nothing when they kept the default.
 */
export function brandColorStyle(
    hex: string | null | undefined,
): CSSProperties | undefined {
    if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) {
        return undefined;
    }

    // The theme's --color-brand is resolved where it's declared (the root),
    // so it's set here too for the override to work inside any element.
    return {
        '--brand': hex,
        '--brand-foreground': readableTextOn(hex),
        '--color-brand': hex,
        '--color-brand-foreground': readableTextOn(hex),
    } as CSSProperties;
}
