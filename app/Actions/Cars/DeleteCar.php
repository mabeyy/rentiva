<?php

namespace App\Actions\Cars;

use App\Models\Car;
use Illuminate\Support\Facades\DB;

class DeleteCar
{
    /**
     * Delete a listing together with its stored photos.
     */
    public function handle(Car $car): void
    {
        DB::transaction(function () use ($car): void {
            $car->images->each->delete();
            $car->delete();
        });
    }
}
