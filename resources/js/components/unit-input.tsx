import { Input } from '@/components/ui/input';

/** A whole-number input with a unit label inside it, e.g. "24 hours". */
export function UnitInput({
    id,
    name,
    defaultValue,
    unit,
    min,
    max,
    placeholder,
    onValueChange,
}: {
    id: string;
    name: string;
    defaultValue: number | null;
    unit: string;
    min: number;
    max: number;
    placeholder?: string;
    /** Called with the typed number, or null when blank. */
    onValueChange?: (value: number | null) => void;
}) {
    return (
        <div className="relative w-36">
            <Input
                id={id}
                name={name}
                type="number"
                inputMode="numeric"
                min={min}
                max={max}
                defaultValue={defaultValue ?? ''}
                placeholder={placeholder}
                onChange={(event) =>
                    onValueChange?.(
                        event.target.value === ''
                            ? null
                            : Number(event.target.value),
                    )
                }
                className="bg-background pr-16 tabular-nums"
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                {unit}
            </span>
        </div>
    );
}
