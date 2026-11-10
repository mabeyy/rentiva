<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The app switched from UTC to Manila time. Date-times saved before the
     * switch were UTC; move them 8 hours on so they mean the same moment when
     * read as Manila time (a transfer deadline, a reminder, a paid date).
     * Date-only columns are calendar days and stay as they are.
     */
    public function up(): void
    {
        $this->shiftHours(8);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->shiftHours(-8);
    }

    private function shiftHours(int $hours): void
    {
        $driver = DB::connection()->getDriverName();
        $grammar = DB::connection()->getQueryGrammar();

        foreach (Schema::getTableListing(schemaQualified: false) as $table) {
            if ($table === 'migrations') {
                continue;
            }

            foreach (Schema::getColumns($table) as $column) {
                if (! in_array(strtolower($column['type_name']), ['datetime', 'timestamp', 'timestamptz'], true)) {
                    continue;
                }

                $name = $grammar->wrap($column['name']);
                $expression = match ($driver) {
                    'sqlite' => "datetime({$name}, '".($hours >= 0 ? '+' : '')."{$hours} hours')",
                    'pgsql' => "{$name} + interval '{$hours} hours'",
                    default => "DATE_ADD({$name}, INTERVAL {$hours} HOUR)",
                };

                DB::update("update {$grammar->wrapTable($table)} set {$name} = {$expression} where {$name} is not null");
            }
        }
    }
};
