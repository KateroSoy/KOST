<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';

        if (Schema::hasTable('kostos_users') && !Schema::hasColumn('kostos_users', 'slug')) {
            if ($isSqlite) {
                DB::statement("ALTER TABLE kostos_users ADD COLUMN slug VARCHAR(191) NULL");
                DB::statement("CREATE UNIQUE INDEX kostos_users_slug_unique ON kostos_users (slug)");
            } else {
                DB::statement("ALTER TABLE kostos_users ADD COLUMN slug VARCHAR(191) NULL AFTER phone");
                DB::statement("ALTER TABLE kostos_users ADD UNIQUE INDEX kostos_users_slug_unique (slug)");
            }
        }

        // Backfill slug for existing users
        $users = DB::table('kostos_users')->get();
        foreach ($users as $user) {
            if (empty($user->slug)) {
                // Try to get kost name from settings
                $setting = DB::table('kostos_settings')
                    ->where('user_id', $user->id)
                    ->first();

                $base = 'pengelola';
                if ($setting) {
                    $data = json_decode($setting->data, true);
                    $kostName = $data['kostName'] ?? null;
                    if ($kostName) {
                        $base = $kostName;
                    }
                }

                $slug = static::makeSlug($base);

                // Ensure unique
                $counter = 1;
                $candidate = $slug;
                while (DB::table('kostos_users')->where('slug', $candidate)->where('id', '!=', $user->id)->exists()) {
                    $candidate = $slug . '-' . $counter++;
                }

                DB::table('kostos_users')->where('id', $user->id)->update(['slug' => $candidate]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('kostos_users') && Schema::hasColumn('kostos_users', 'slug')) {
            if (DB::connection()->getDriverName() === 'sqlite') {
                DB::statement("DROP INDEX IF EXISTS kostos_users_slug_unique");
            } else {
                DB::statement("ALTER TABLE kostos_users DROP INDEX kostos_users_slug_unique");
            }
            DB::statement("ALTER TABLE kostos_users DROP COLUMN slug");
        }
    }

    private static function makeSlug(string $text): string
    {
        $text = strtolower(trim($text));
        $text = preg_replace('/[^a-z0-9\s-]/', '', $text);
        $text = preg_replace('/[\s-]+/', '-', $text);
        return trim($text, '-') ?: 'pengelola';
    }
};
