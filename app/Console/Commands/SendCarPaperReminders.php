<?php

namespace App\Console\Commands;

use App\Enums\UserStatus;
use App\Models\Car;
use App\Notifications\CarPaperExpiring;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('cars:remind-papers')]
#[Description('Remind owners 30 days, 7 days and on the day a car\'s registration runs out.')]
class SendCarPaperReminders extends Command
{
    /** Days before expiry that a reminder goes out. */
    public const array REMIND_AT = [30, 7, 0];

    /**
     * Execute the console command. Each reminder goes out once per expiry
     * date; a day the scheduler missed is caught up on the next run.
     */
    public function handle(): int
    {
        $sent = 0;

        Car::query()
            ->whereNotNull('registration_expires_on')
            ->whereDate('registration_expires_on', '>=', today())
            ->whereDate('registration_expires_on', '<=', today()->addDays(max(self::REMIND_AT)))
            ->whereRelation('owner', 'status', UserStatus::Active)
            ->with('owner')
            ->each(function (Car $car) use (&$sent): void {
                $daysLeft = (int) today()->diffInDays($car->registration_expires_on, false);
                // The closest reminder point already reached, e.g. 7 when 5 days are left.
                $due = collect(self::REMIND_AT)->filter(fn (int $days): bool => $daysLeft <= $days)->min();

                if ($due === null || ($car->registration_reminded_at_days !== null && $car->registration_reminded_at_days <= $due)) {
                    return;
                }

                $car->owner->notify(new CarPaperExpiring($car, 'registration', $daysLeft));
                $car->forceFill(['registration_reminded_at_days' => $due])->saveQuietly();
                $sent++;
            });

        $this->info("Sent {$sent} ".str('reminder')->plural($sent).'.');

        return self::SUCCESS;
    }
}
