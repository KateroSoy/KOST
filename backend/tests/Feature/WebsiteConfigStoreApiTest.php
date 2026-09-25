<?php
// backend/tests/Feature/WebsiteConfigStoreApiTest.php
namespace Tests\Feature;

use App\Models\User;
use App\Models\WebsiteConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebsiteConfigStoreApiTest extends TestCase
{
    use RefreshDatabase;

    private function owner(string $phone): User
    {
        return User::create(['name' => 'Owner', 'phone' => $phone, 'password' => bcrypt('secret123'), 'role' => 'owner', 'status' => 'active', 'plan' => 'pro', 'expires_at' => now()->addDays(7), 'slug' => 'owner-' . $phone]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'propertyId' => 'prop-a', 'templateId' => 'align', 'subdomain' => 'greenhousekemang',
            'customDomain' => null, 'headline' => 'H', 'subheadline' => 'S', 'aboutText' => 'A',
            'accentColor' => '#173B30', 'whatsappDirect' => '0812', 'sections' => [], 'isPublished' => true,
        ], $overrides);
    }

    public function test_subdomain_taken_by_another_owner_gets_unique_suffix_instead_of_500()
    {
        $this->actingAs($this->owner('081400000011'), 'sanctum')
            ->postJson('/api/website-configs', $this->payload())
            ->assertOk()->assertJson(['subdomain' => 'greenhousekemang']);

        $this->actingAs($this->owner('081400000012'), 'sanctum')
            ->postJson('/api/website-configs', $this->payload(['propertyId' => 'prop-b']))
            ->assertOk()->assertJson(['subdomain' => 'greenhousekemang-1']);
    }

    public function test_owner_resaving_own_config_keeps_its_subdomain()
    {
        $user = $this->owner('081400000013');
        $this->actingAs($user, 'sanctum')->postJson('/api/website-configs', $this->payload(['subdomain' => 'mine']))->assertOk();
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/website-configs', $this->payload(['subdomain' => 'mine', 'headline' => 'New']))
            ->assertOk()->assertJson(['subdomain' => 'mine']);

        $this->assertSame('New', WebsiteConfig::where('user_id', $user->id)->first()->headline);
    }

    public function test_custom_domain_taken_by_another_owner_is_rejected_with_422()
    {
        $this->actingAs($this->owner('081400000014'), 'sanctum')
            ->postJson('/api/website-configs', $this->payload(['subdomain' => 'one', 'customDomain' => 'taken.com']))
            ->assertOk();

        $this->actingAs($this->owner('081400000015'), 'sanctum')
            ->postJson('/api/website-configs', $this->payload(['propertyId' => 'prop-b', 'subdomain' => 'two', 'customDomain' => 'taken.com']))
            ->assertStatus(422)->assertJsonValidationErrors('customDomain');
    }
}
