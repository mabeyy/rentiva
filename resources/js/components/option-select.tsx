import { ChevronDownIcon } from 'lucide-react';
import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Option } from '@/types';

const ANY_VALUE = '__any__';

/**
 * Dropdown for a list of value/label options. Pass `anyLabel` to allow
 * clearing the value, and `name` to submit it with a native/Inertia form.
 *
 * Built on a non-modal dropdown menu rather than Radix Select, because Select
 * always locks page scrolling while it is open.
 */
export function OptionSelect({
    id,
    name,
    options,
    value,
    defaultValue,
    onChange,
    placeholder = 'Select…',
    anyLabel,
    className,
}: {
    id?: string;
    name?: string;
    options: Option[];
    value?: string | null;
    defaultValue?: string;
    onChange?: (value: string | null) => void;
    placeholder?: string;
    anyLabel?: string;
    className?: string;
}) {
    const [uncontrolledValue, setUncontrolledValue] = useState(
        defaultValue ?? null,
    );
    const selectedValue = value === undefined ? uncontrolledValue : value;
    const selectedLabel =
        selectedValue === null
            ? anyLabel
            : options.find((option) => option.value === selectedValue)?.label;

    function select(selected: string): void {
        const next = selected === ANY_VALUE ? null : selected;

        setUncontrolledValue(next);
        onChange?.(next);
    }

    return (
        <DropdownMenu>
            {name && (
                <input type="hidden" name={name} value={selectedValue ?? ''} />
            )}
            <DropdownMenuTrigger
                id={id}
                className={cn(
                    'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-left text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50',
                    !selectedLabel && 'text-muted-foreground',
                    className,
                )}
            >
                <span className="truncate">{selectedLabel ?? placeholder}</span>
                <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                className="max-h-72 min-w-(--radix-dropdown-menu-trigger-width) overflow-y-auto"
            >
                <DropdownMenuRadioGroup
                    value={selectedValue ?? ANY_VALUE}
                    onValueChange={select}
                >
                    {anyLabel && (
                        <DropdownMenuRadioItem value={ANY_VALUE}>
                            {anyLabel}
                        </DropdownMenuRadioItem>
                    )}
                    {options.map((option) => (
                        <DropdownMenuRadioItem
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * Turn plain strings (e.g. locations) into options.
 */
export function toOptions(values: string[]): Option[] {
    return values.map((value) => ({ value, label: value }));
}
