import { ImagePlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CarImage } from '@/types';
import type { FormErrors } from './types';

/**
 * Existing photos (toggle removal) plus new uploads with local previews.
 */
export function PhotosSection({
    existingImages = [],
    errors,
}: {
    existingImages?: CarImage[];
    errors: FormErrors;
}) {
    const [removedIds, setRemovedIds] = useState<number[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    useEffect(
        () => () => previews.forEach((url) => URL.revokeObjectURL(url)),
        [previews],
    );

    function toggleRemoved(id: number): void {
        setRemovedIds((ids) =>
            ids.includes(id)
                ? ids.filter((removedId) => removedId !== id)
                : [...ids, id],
        );
    }

    const uploadError = Object.entries(errors).find(([key]) =>
        key.startsWith('images'),
    )?.[1];

    return (
        <div className="space-y-4">
            {(existingImages.length > 0 || previews.length > 0) && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {existingImages.map((image) => {
                        const isRemoved = removedIds.includes(image.id);

                        return (
                            <div
                                key={image.id}
                                className="relative aspect-[4/3] overflow-hidden rounded-lg border"
                            >
                                <img
                                    src={image.url}
                                    alt=""
                                    className={cn(
                                        'size-full object-cover',
                                        isRemoved && 'opacity-30',
                                    )}
                                />
                                {isRemoved && (
                                    <input
                                        type="hidden"
                                        name="removed_image_ids[]"
                                        value={image.id}
                                    />
                                )}
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={
                                        isRemoved ? 'secondary' : 'destructive'
                                    }
                                    className="absolute top-2 right-2 h-7 px-2"
                                    onClick={() => toggleRemoved(image.id)}
                                >
                                    {isRemoved ? (
                                        'Undo'
                                    ) : (
                                        <X className="size-4" />
                                    )}
                                </Button>
                            </div>
                        );
                    })}
                    {previews.map((url) => (
                        <div
                            key={url}
                            className="aspect-[4/3] overflow-hidden rounded-lg border border-dashed"
                        >
                            <img
                                src={url}
                                alt=""
                                className="size-full object-cover"
                            />
                        </div>
                    ))}
                </div>
            )}

            <label
                htmlFor="images"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground hover:bg-muted/50"
            >
                <ImagePlus className="size-6" />
                Add photos (JPG, PNG or WebP, up to 5 MB each, max 10 photos)
            </label>
            <Input
                id="images"
                name="images[]"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(event) =>
                    setPreviews(
                        Array.from(event.target.files ?? []).map((file) =>
                            URL.createObjectURL(file),
                        ),
                    )
                }
            />
            <InputError message={uploadError} />
            {errors.removed_image_ids && (
                <InputError message={errors.removed_image_ids} />
            )}
        </div>
    );
}
