<?php

namespace App\Concerns;

/**
 * Exposes a backed enum's cases as value/label pairs for frontend selects.
 */
trait HasOptions
{
    /**
     * Get the human-readable label for the case.
     */
    abstract public function label(): string;

    /**
     * Get every case as a value/label pair.
     *
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $case): array => $case->toOption(),
            self::cases(),
        );
    }

    /**
     * Get the case as a value/label pair.
     *
     * @return array{value: string, label: string}
     */
    public function toOption(): array
    {
        return ['value' => $this->value, 'label' => $this->label()];
    }
}
