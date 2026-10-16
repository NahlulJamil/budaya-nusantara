<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_creates_user_with_user_role_and_token(): void
    {
        $response = $this->postJson('/api/register', [
            'username' => 'budaya1',
            'email' => 'budaya1@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.user.username', 'budaya1')
            ->assertJsonPath('data.user.role', 'user')
            ->assertJsonStructure(['data' => ['user', 'token', 'token_type']])
            ->assertJsonMissingPath('data.user.password');

        $this->assertDatabaseHas('users', ['email' => 'budaya1@example.com', 'role' => 'user']);
    }

    public function test_register_ignores_admin_role_attempt(): void
    {
        $response = $this->postJson('/api/register', [
            'username' => 'nakal',
            'email' => 'nakal@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'admin',
        ]);

        $response->assertCreated()->assertJsonPath('data.user.role', 'user');
        $this->assertDatabaseHas('users', ['email' => 'nakal@example.com', 'role' => 'user']);
    }

    public function test_register_validates_input(): void
    {
        $this->postJson('/api/register', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['username', 'email', 'password']);
    }

    public function test_register_rejects_duplicate_username_and_email(): void
    {
        User::factory()->create(['username' => 'sama', 'email' => 'sama@example.com']);

        $this->postJson('/api/register', [
            'username' => 'sama',
            'email' => 'sama@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertUnprocessable()->assertJsonValidationErrors(['username', 'email']);
    }

    public function test_login_returns_token_and_me_works(): void
    {
        User::factory()->create(['email' => 'masuk@example.com']);

        $login = $this->postJson('/api/login', [
            'email' => 'masuk@example.com',
            'password' => 'password',
        ]);

        $login->assertOk()->assertJsonStructure(['data' => ['user', 'token']]);
        $token = $login->json('data.token');

        $this->withToken($token)->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.user.email', 'masuk@example.com')
            ->assertJsonMissingPath('data.user.password');
    }

    public function test_login_rejects_wrong_password_without_details(): void
    {
        User::factory()->create(['email' => 'salah@example.com']);

        $response = $this->postJson('/api/login', [
            'email' => 'salah@example.com',
            'password' => 'bukan-password',
        ]);

        $response->assertUnprocessable();
        $this->assertStringNotContainsString('bukan-password', $response->getContent());
    }

    public function test_me_requires_token(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
    }

    public function test_logout_revokes_current_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $this->withToken($token)->postJson('/api/logout')->assertOk();
        $this->assertSame(0, $user->tokens()->count());

        // Bersihkan cache guard dalam instance aplikasi yang sama.
        Auth::forgetGuards();
        $this->withToken($token)->getJson('/api/me')->assertUnauthorized();
    }
}
