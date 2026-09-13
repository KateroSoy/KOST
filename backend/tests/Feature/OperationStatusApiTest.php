<?php
// backend/tests/Feature/OperationStatusApiTest.php
namespace Tests\Feature;

use App\Models\OperationTask;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OperationStatusApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_update_task_status()
    {
        $user = User::create(['name' => 'Owner', 'phone' => '081400000002', 'password' => bcrypt('secret123'), 'role' => 'owner', 'status' => 'active', 'plan' => 'pro', 'slug' => 'owner-op']);
        $task = OperationTask::create(['user_id' => $user->id, 'custom_id' => 'op1', 'property_id' => 'prop-1', 'type' => 'Maintenance', 'title' => 'AC bocor', 'room_number' => '101', 'priority' => 'Tinggi', 'status' => 'Open', 'assigned_to' => 'Staff A', 'estimated_cost' => 0]);

        $this->actingAs($user, 'sanctum')
            ->patchJson('/api/operations/op1/status', ['status' => 'Completed'])
            ->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertEquals('Completed', $task->fresh()->status);
    }
}
