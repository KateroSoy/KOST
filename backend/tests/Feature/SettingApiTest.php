<?php

namespace Tests\Feature;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_settings_returns_existing_data_and_put_updates_it(): void
    {
        $user = $this->actingAsOwner();

        // First call auto-creates a default settings row for this user.
        $original = $this->getJson('/api/settings')->assertOk()->json();
        $this->assertSame('StayFlow Residence', $original['kostName']);

        $updated = $original;
        $updated['reminderTemplate'] = 'smoke-template-'.time();

        $this->putJson('/api/settings', $updated)
            ->assertOk()
            ->assertJsonFragment(['reminderTemplate' => $updated['reminderTemplate']]);

        $this->assertSame(
            $updated['reminderTemplate'],
            Setting::where('user_id', $user->id)->first()->data['reminderTemplate']
        );
    }
}
