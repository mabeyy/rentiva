<?php

use App\Models\NotificationLog;
use App\Models\PageVisit;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('bookings:release-unpaid')->everyMinute()->withoutOverlapping();
Schedule::command('bookings:expire-pending')->everyFifteenMinutes()->withoutOverlapping();
Schedule::command('payments:prune-proofs')->dailyAt('03:00');
Schedule::command('bookings:complete-finished')->dailyAt('10:00');
Schedule::command('bookings:anonymize')->dailyAt('03:30');
Schedule::command('cars:remind-papers')->dailyAt('08:00');
Schedule::command('billing:issue-invoices')->dailyAt('06:00');
Schedule::command('billing:send-reminders')->dailyAt('09:00');
Schedule::command('bookings:send-reminders')->everyFiveMinutes()->withoutOverlapping();
Schedule::command('model:prune', ['--model' => [PageVisit::class, NotificationLog::class]])->dailyAt('04:00');
