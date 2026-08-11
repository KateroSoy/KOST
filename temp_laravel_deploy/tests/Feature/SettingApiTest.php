<?php

namespace Tests\Feature;

use App\Models\Setting;
use Tests\TestCase;

class SettingApiTest extends TestCase
{
    public function test_get_settings_returns_existing_data_and_put_updates_it(): void
    {
        $original = Setting::find(1)->data;

        $get = $this->getJson('/api/settings')->assertOk()->json();
        $this->assertSame($original['kostName'], $get['kostName']);

        $updated = $original;
        $updated['reminderTemplate'] = 'smoke-template-'.time();

        try {
            $this->putJson('/api/settings', $updated)
                ->assertOk()
                ->assertJsonFragment(['reminderTemplate' => $updated['reminderTemplate']]);

            $this->assertSame($updated['reminderTemplate'], Setting::find(1)->data['reminderTemplate']);
        } finally {
            // restore the original reminderTemplate so this test doesn't leave
            // real settings mutated, even if an assertion above failed
            $this->putJson('/api/settings', $original);
        }

        $this->assertSame($original['reminderTemplate'], Setting::find(1)->data['reminderTemplate']);
    }
}
