<?php

namespace Tests\Feature;

use App\Models\Daerah;
use App\Models\JenisTradisi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class AdminValidationTest extends TestCase
{
    use RefreshDatabase;

    private string $adminToken;

    private Daerah $d1;

    private JenisTradisi $jenis;

    protected function setUp(): void
    {
        parent::setUp();

        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();
        Auth::forgetGuards();
        $this->adminToken = $admin->createToken('t')->plainTextToken;

        $this->d1 = Daerah::create(['nama' => 'Jawa', 'provinsi' => 'Jawa Tengah']);
        $this->jenis = JenisTradisi::create(['nama' => 'Upacara Adat']);
    }

    private function basePayload(): array
    {
        return [
            'daerah_id' => $this->d1->id,
            'category' => 'tradisi',
            'title' => 'Seren Taun',
            'description' => 'd',
            'history' => 'h',
            'meaning' => 'm',
            'detail' => [
                'jenis_tradisi_id' => $this->jenis->id,
                'process' => 'pawai',
                'values' => 'syukur',
                'implementation_time' => 'panen',
            ],
        ];
    }

    public function test_admin_budaya_rejects_bad_status_category_and_fk(): void
    {
        $t = $this->adminToken;

        $id = $this->withToken($t)->postJson('/api/admin/budaya', $this->basePayload())
            ->assertCreated()->json('data.id');

        // Status invalid saat create maupun update.
        $this->withToken($t)->postJson('/api/admin/budaya', [
            ...$this->basePayload(), 'title' => 'X', 'status' => 'archived',
        ])->assertUnprocessable()->assertJsonValidationErrors(['status']);
        $this->withToken($t)->patchJson("/api/admin/budaya/{$id}", ['status' => 'archived'])
            ->assertUnprocessable()->assertJsonValidationErrors(['status']);

        // Kategori dan foreign key invalid.
        $this->withToken($t)->postJson('/api/admin/budaya', [
            ...$this->basePayload(), 'title' => 'Y', 'category' => 'tarian',
        ])->assertUnprocessable()->assertJsonValidationErrors(['category']);
        $this->withToken($t)->postJson('/api/admin/budaya', [
            ...$this->basePayload(),
            'title' => 'Z',
            'detail' => [...$this->basePayload()['detail'], 'jenis_tradisi_id' => 999],
        ])->assertUnprocessable()->assertJsonValidationErrors(['detail.jenis_tradisi_id']);

        // Varian dengan gender ganda dalam satu request.
        $this->withToken($t)->postJson('/api/admin/budaya', [
            'daerah_id' => $this->d1->id, 'category' => 'baju_adat', 'title' => 'Kebaya',
            'description' => 'd', 'history' => 'h', 'meaning' => 'm',
            'detail' => ['variants' => [
                ['gender' => 'pria'], ['gender' => 'pria'],
            ]],
        ])->assertUnprocessable();
    }

    public function test_admin_soal_rejects_bad_enum_and_missing_fields(): void
    {
        $t = $this->adminToken;
        $aksaraId = \App\Models\Aksara::create(['daerah_id' => $this->d1->id, 'name' => 'Aksara Jawa'])->id;

        $this->withToken($t)->postJson("/api/admin/aksara/{$aksaraId}/soal", [
            'question' => 'Q', 'displayed_character' => 'ha',
            'correct_answer' => 'ha', 'generated_by' => 'robot',
        ])->assertUnprocessable()->assertJsonValidationErrors(['generated_by']);

        $this->withToken($t)->patchJson("/api/admin/aksara/{$aksaraId}", ['daerah_id' => 999])
            ->assertUnprocessable()->assertJsonValidationErrors(['daerah_id']);
    }

    public function test_public_endpoints_stay_public_and_consistent(): void
    {
        // Tanpa token: publik 200/404 JSON, privat 401.
        $this->getJson('/api/budaya')->assertOk()->assertJsonStructure(['message', 'data', 'meta']);
        $this->getJson('/api/budaya/999')->assertNotFound()->assertJsonStructure(['message']);
        $this->getJson('/api/galeri-saya')->assertUnauthorized();
        $this->getJson('/api/kuis/riwayat')->assertUnauthorized();
        $this->getJson('/api/chatbot/sessions')->assertUnauthorized();
    }
}
