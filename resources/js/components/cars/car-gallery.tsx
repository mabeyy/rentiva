import { CarFront } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { CarImage } from '@/types';

export function CarGallery({
    images,
    alt,
}: {
    images: CarImage[];
    alt: string;
}) {
    const [activeIndex, setActiveIndex] = useState(0);
    const activeImage = images[activeIndex];

    if (!activeImage) {
        return (
            <div className="flex aspect-[16/10] items-center justify-center rounded-3xl bg-muted">
                <CarFront className="size-12 text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="aspect-[16/10] overflow-hidden rounded-3xl bg-muted">
                <img
                    src={activeImage.url}
                    alt={alt}
                    className="size-full object-cover"
                />
            </div>
            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((image, index) => (
                        <button
                            key={image.id}
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            aria-label={`Show photo ${index + 1}`}
                            className={cn(
                                'h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-opacity',
                                index === activeIndex
                                    ? 'border-brand'
                                    : 'border-transparent opacity-70 hover:opacity-100',
                            )}
                        >
                            <img
                                src={image.url}
                                alt=""
                                className="size-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
