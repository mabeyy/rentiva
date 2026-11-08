<?php

namespace App\Concerns;

use App\Enums\BodyType;
use App\Enums\Drivetrain;
use App\Enums\FuelType;
use App\Enums\Transmission;

trait ProvidesCarOptions
{
    /**
     * Get the select options for a car's enum-backed specifications.
     *
     * @return array<string, array<int, array{value: string, label: string}>>
     */
    protected function carOptions(): array
    {
        return [
            'bodyTypes' => BodyType::options(),
            'transmissions' => Transmission::options(),
            'fuelTypes' => FuelType::options(),
            'drivetrains' => Drivetrain::options(),
        ];
    }
}
