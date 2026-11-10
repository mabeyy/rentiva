import type { LucideIcon } from 'lucide-react';
import { ImageUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * A file input that looks like the other inputs: an icon, the chosen file's
 * name (or a placeholder) and a Browse button, instead of the browser's
 * "Choose File · No file chosen". Works in plain forms through `name`, or
 * hands the files over through `onFiles`.
 */
export function FilePicker({
    id,
    name,
    accept = 'image/jpeg,image/png,image/webp',
    multiple = false,
    required = false,
    placeholder = 'Choose a photo',
    icon: Icon = ImageUp,
    onFiles,
    className,
}: {
    id: string;
    name?: string;
    accept?: string;
    multiple?: boolean;
    required?: boolean;
    placeholder?: string;
    icon?: LucideIcon;
    onFiles?: (files: File[]) => void;
    className?: string;
}) {
    const [label, setLabel] = useState<string | null>(null);

    return (
        <label
            htmlFor={id}
            className={cn(
                'flex h-9 min-w-0 cursor-pointer items-center gap-2 rounded-md border bg-background pr-1.5 pl-3 text-sm shadow-xs transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 hover:border-foreground/30',
                className,
            )}
        >
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <span
                className={cn(
                    'min-w-0 flex-1 truncate',
                    !label && 'text-muted-foreground',
                )}
            >
                {label ?? placeholder}
            </span>
            <span className="shrink-0 rounded-full bg-muted px-3 py-0.5 text-xs font-medium">
                Browse
            </span>
            <input
                id={id}
                name={name}
                type="file"
                accept={accept}
                multiple={multiple}
                required={required}
                className="sr-only"
                onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    setLabel(
                        files.length === 0
                            ? null
                            : files.length === 1
                              ? files[0].name
                              : `${files.length} photos chosen`,
                    );
                    onFiles?.(files);
                }}
            />
        </label>
    );
}
