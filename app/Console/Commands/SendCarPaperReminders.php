<?php

namespace App\Console\Commands;

use App\Models\Car;
use App\Notifications\CarPaperExpiring;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('cars:remind-papers')]
#[Description('Remind owners 30 days, 7 days and on the day a car\'s registration or insurance runs out.')]
class SendCarPaperReminders extends Command
{
    /** Days before expiry that a reminder goes out. */
    public const array REMIND_AT = [30, 7, 0];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $sent = 0;
        $dates = array_map(fn (int $days): string => today()->addDays($days)->toDateString(), self::REMIND_AT);

        foreach (['registration', 'insurance'] as $paper) {
            Car::query()
                ->where(function ($query) use ($paper, $dates): void {
                    foreach ($dates as $date) {
                        $query->orWhereDate("{$paper}_expires_on", $date);
                    }
                })
                ->with('owner')
                ->each(function (Car $car) use ($paper, &$sent): void {
                    $car->owner->notify(new CarPaperExpiring($car, $paper, (int) today()->diffInDays($car->{"{$paper}_expires_on"}, false)));
                    $sent++;
                });
        }

        $this->info("Sent {$sent} ".str('reminder')->plural($sent).'.');

        return self::SUCCESS;
    }
}
