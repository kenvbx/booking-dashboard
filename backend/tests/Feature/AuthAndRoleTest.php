<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthAndRoleTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_and_access_their_profile(): void
    {
        User::factory()->create([
            'name' => 'Helio Admin',
            'email' => 'admin@helio.test',
            'password' => 'password',
            'role' => 'admin',
        ]);

        $login = $this->postJson('/api/auth/login', [
            'email' => 'admin@helio.test',
            'password' => 'password',
            'device_name' => 'phpunit',
        ]);

        $login->assertOk()
            ->assertJsonPath('user.role', 'admin')
            ->assertJsonStructure(['access_token', 'token_type', 'user']);
        $token = $login->json('access_token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'admin@helio.test');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/logout')
            ->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_staff_cannot_access_admin_resources(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'staff']), 'sanctum')
            ->getJson('/api/customers')
            ->assertForbidden();
    }

    public function test_guest_cannot_access_protected_api(): void
    {
        $this->getJson('/api/customers')->assertUnauthorized();
    }

    public function test_admin_can_create_a_customer(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']), 'sanctum')
            ->postJson('/api/customers', ['name' => 'Maya Singh'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Maya Singh');
    }

    public function test_login_is_rate_limited_per_email_and_ip(): void
    {
        foreach (range(1, 5) as $attempt) {
            $this->postJson('/api/auth/login', [
                'email' => 'limited@example.test',
                'password' => 'wrong-password',
            ])->assertUnauthorized();
        }

        $this->postJson('/api/auth/login', [
            'email' => 'limited@example.test',
            'password' => 'wrong-password',
        ])->assertStatus(429);
    }
}
