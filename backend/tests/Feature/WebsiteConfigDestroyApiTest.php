<?php
// backend/tests/Feature/WebsiteConfigDestroyApiTest.php
namespace Tests\Feature;

use App\Models\User;
use App\Models\WebsiteConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebsiteConfigDestroyApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_delete_own_website_config()
    {
        $user = User::create(['name' => 'Owner', 'phone' => '081400000004', 'password' => bcrypt('secret123'), 'role' => 'owner', 'status' => 'active', 'plan' => 'pro', 'slug' => 'owner-web']);
        WebsiteConfig::create(['user_id' => $user->id, 'property_id' => 'prop-1', 'template_id' => 'urban', 'subdomain' => 'demo', 'headline' => 'H', 'subheadline' => 'S', 'about_text' => 'A', 'accent_color' => '#000', 'whatsapp_direct' => '0812', 'sections' => [], 'is_published' => true]);

        $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/website-configs/prop-1')
            ->assertStatus(200)
            ->assertJson(['ok' => true]);

        $this->assertNull(WebsiteConfig::where('user_id', $user->id)->where('property_id', 'prop-1')->first());
    }
}
