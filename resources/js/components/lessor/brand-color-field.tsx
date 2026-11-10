import { Check, Plus } from 'lucide-react';
import { useState } from 'react';
import { brandColorPresets, brandColorStyle } from '@/lib/brand-color';
import { cn } from '@/lib/utils';
import { Hint } from '@/components/info-tip';

/**
 * Swatch picker for a booking page's brand color, with a custom color option
 * and a live preview of a button in that color. Submits as `brand_color`.
 */
export function BrandColorField({
    defaultValue,
}: {
    defaultValue: string | null;
}) {
    const [color, setColor] = useState(
        defaultValue ?? brandColorPresets[0].value,
    );
    const isCustom = !brandColorPresets.some(
        (preset) => preset.value.toLowerCase() === color.toLowerCase(),
    );

    return (
        <div className="space-y-3">
            <input type="hidden" name="brand_color" value={color} />

            <div
                role="radiogroup"
                aria-label="Brand color"
                className="flex flex-wrap gap-2"
            >
                {brandColorPresets.map((preset) => {
                    const isSelected =
                        preset.value.toLowerCase() === color.toLowerCase();

                    return (
                        <Hint key={preset.value} text={preset.name}>
                            <button
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                aria-label={preset.name}
                                onClick={() => setColor(preset.value)}
                                style={{ backgroundColor: preset.value }}
                                className={cn(
                                    'flex size-9 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-background transition-transform hover:scale-110',
                                    isSelected && 'ring-2 ring-foreground',
                                )}
                            >
                                {isSelected && <Check className="size-4" />}
                            </button>
                        </Hint>
                    );
                })}

                <Hint text="Custom color">
                    <label
                        style={
                            isCustom ? { backgroundColor: color } : undefined
                        }
                        className={cn(
                            'relative flex size-9 cursor-pointer items-center justify-center rounded-full border-2 border-dashed text-muted-foreground ring-offset-2 ring-offset-background transition-transform hover:scale-110',
                            isCustom &&
                                'border-transparent text-white ring-2 ring-foreground',
                        )}
                    >
                        {isCustom ? (
                            <Check className="size-4" />
                        ) : (
                            <Plus className="size-4" />
                        )}
                        <span className="sr-only">Custom color</span>
                        <input
                            type="color"
                            value={color}
                            onChange={(event) => setColor(event.target.value)}
                            className="absolute inset-0 cursor-pointer opacity-0"
                        />
                    </label>
                </Hint>
            </div>

            <div
                style={brandColorStyle(color)}
                className="flex flex-wrap items-center gap-3"
            >
                <span className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground">
                    Request to book
                </span>
                <span className="text-sm font-semibold text-brand">
                    ₱2,700/day
                </span>
                <span className="font-mono text-xs text-muted-foreground uppercase">
                    {color}
                </span>
            </div>
        </div>
    );
}
