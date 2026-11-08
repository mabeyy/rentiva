<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations: an audit trail of who did what to each booking,
     * back-filled from the timestamps existing bookings already carry.
     */
    public function up(): void
    {
        Schema::create('booking_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->string('action', 40);
            $table->string('actor_type', 20);
            $table->string('actor_name', 120);
            $table->text('description')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index(['booking_id', 'created_at']);
            $table->index('action');
        });

        $owners = DB::table('users')->pluck('name', 'id');

        DB::table('bookings')->join('cars', 'cars.id', '=', 'bookings.car_id')
            ->select('bookings.*', 'cars.owner_id')
            ->orderBy('bookings.id')
            ->get()
            ->each(function (object $booking) use ($owners): void {
                $owner = $owners[$booking->owner_id] ?? 'Owner';
                $events = [
                    ['requested', 'renter', $booking->renter_name, null, $booking->created_at],
                    ['confirmed', 'owner', $owner, null, $booking->confirmed_at],
                    ['declined', 'owner', $owner, $booking->decline_reason, $booking->declined_at],
                    ['cancelled', 'renter', $booking->renter_name, null, $booking->cancelled_at],
                    ['payment_submitted', 'renter', $booking->renter_name, $booking->payment_reference ? 'Reference '.$booking->payment_reference : null, $booking->payment_submitted_at],
                    ['payment_approved', 'owner', $owner, null, $booking->paid_at],
                ];

                if ($booking->status === 'completed') {
                    $events[] = ['completed', 'owner', $owner, null, $booking->end_date];
                }

                foreach ($events as [$action, $actorType, $actorName, $description, $at]) {
                    if ($at !== null) {
                        DB::table('booking_events')->insert([
                            'booking_id' => $booking->id,
                            'action' => $action,
                            'actor_type' => $actorType,
                            'actor_name' => $actorName,
                            'description' => $description,
                            'created_at' => $at,
                        ]);
                    }
                }
            });

        DB::table('reviews')->join('bookings', 'bookings.id', '=', 'reviews.booking_id')
            ->select('reviews.*', 'bookings.renter_name')
            ->get()
            ->each(fn (object $review) => DB::table('booking_events')->insert([
                'booking_id' => $review->booking_id,
                'action' => 'reviewed',
                'actor_type' => 'renter',
                'actor_name' => $review->renter_name,
                'description' => $review->rating.' out of 5 stars',
                'created_at' => $review->created_at,
            ]));
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('booking_events');
    }
};
