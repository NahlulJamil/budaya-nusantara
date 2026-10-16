<?php

namespace Tests\Feature;

use App\Models\ContentSource;
use App\Models\CulturalContent;
use App\Models\Daerah;
use App\Models\GaleriPost;
use App\Models\JenisTradisi;
use App\Models\Makanan;
use App\Models\Tradisi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $user;

    private Daerah $d1;

    private JenisTradisi $jenis;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create();
        $this->admin->forceFill(['role' => 'admin'])->save();
        $this->user = User::factory()->create();
        $this->d1 = Daerah::create(['nama' => 'Jawa', 'provinsi' => 'Jawa Tengah']);
        $this->jenis = JenisTradisi::create(['nama' => 'Upacara Adat']);
    }

    private function adminToken(): string
    {
        return $this->admin->createToken('t')->plainTextToken;
    }

    private function userToken(): string
    {
        return $this->user->createToken('t')->plainTextToken;
    }

    private function tradisiPayload(): array
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

    public function test_admin_guard_blocks_anon_and_biasa(): void
    {
        $this->getJson('/api/admin/budaya')->assertUnauthorized();
        $this->postJson('/api/admin/budaya', [])->assertUnauthorized();

        Auth::forgetGuards();
        $t = $this->userToken();
        $this->withToken($t)->getJson('/api/admin/budaya')->assertForbidden();
        $this->withToken($t)->postJson('/api/admin/budaya', [])->assertForbidden();
        $this->withToken($t)->patchJson('/api/admin/budaya/1', [])->assertForbidden();
        $this->withToken($t)->deleteJson('/api/admin/budaya/1')->assertForbidden();
        $this->withToken($t)->getJson('/api/admin/daerah')->assertForbidden();
        $this->withToken($t)->deleteJson('/api/admin/daerah/1')->assertForbidden();
    }

    public function test_admin_create_budaya_with_detail_and_validation(): void
    {
        Auth::forgetGuards();
        $t = $this->adminToken();

        $r = $this->withToken($t)->postJson('/api/admin/budaya', $this->tradisiPayload())
            ->assertCreated();
        $id = $r->json('data.id');

        $this->assertDatabaseHas('cultural_contents', [
            'id' => $id, 'category' => 'tradisi', 'status' => 'draft', 'created_by' => $this->admin->id,
        ]);
        $this->assertDatabaseHas('tradisi', ['content_id' => $id, 'process' => 'pawai']);

        // Kategori invalid, daerah invalid, detail tradisi tak lengkap.
        $this->withToken($t)->postJson('/api/admin/budaya', [
            ...$this->tradisiPayload(), 'category' => 'tarian',
        ])->assertUnprocessable();
        $this->withToken($t)->postJson('/api/admin/budaya', [
            ...$this->tradisiPayload(), 'daerah_id' => 999,
        ])->assertUnprocessable()->assertJsonValidationErrors(['daerah_id']);
        $this->withToken($t)->postJson('/api/admin/budaya', [
            ...$this->tradisiPayload(), 'detail' => ['process' => 'saja'],
        ])->assertUnprocessable()->assertJsonValidationErrors(['detail.jenis_tradisi_id']);

        // created_by dari client diabaikan.
        $r2 = $this->withToken($t)->postJson('/api/admin/budaya', [
            ...$this->tradisiPayload(), 'title' => 'Lain', 'category' => 'makanan',
            'created_by' => 999,
        ])->assertCreated();
        $this->assertDatabaseHas('cultural_contents', ['id' => $r2->json('data.id'), 'created_by' => $this->admin->id]);
    }

    public function test_admin_publish_flow_and_public_visibility(): void
    {
        Auth::forgetGuards();
        $t = $this->adminToken();

        $id = $this->withToken($t)->postJson('/api/admin/budaya', $this->tradisiPayload())
            ->assertCreated()->json('data.id');

        // Draft: admin bisa lihat, publik tidak.
        $this->withToken($t)->getJson("/api/admin/budaya/{$id}")->assertOk()
            ->assertJsonPath('data.status', 'draft');
        $this->getJson("/api/budaya/{$id}")->assertNotFound();

        $this->withToken($t)->patchJson("/api/admin/budaya/{$id}", ['status' => 'published', 'title' => 'Seren Taun Raya'])
            ->assertOk();
        $this->assertDatabaseHas('cultural_contents', ['id' => $id, 'title' => 'Seren Taun Raya', 'status' => 'published']);
        $this->assertDatabaseStillHasTradisi($id);

        $this->getJson("/api/budaya/{$id}")->assertOk()->assertJsonPath('data.title', 'Seren Taun Raya');
        $this->withToken($t)->getJson('/api/admin/budaya/999')->assertNotFound();
    }

    public function test_admin_change_category_replaces_detail(): void
    {
        Auth::forgetGuards();
        $t = $this->adminToken();

        $id = $this->withToken($t)->postJson('/api/admin/budaya', [
            'daerah_id' => $this->d1->id, 'category' => 'makanan', 'title' => 'Gudeg',
            'description' => 'd', 'history' => 'h', 'meaning' => 'm',
            'detail' => ['ingredients' => 'nangka'],
        ])->assertCreated()->json('data.id');
        $this->assertDatabaseHas('makanan', ['content_id' => $id]);

        $this->withToken($t)->patchJson("/api/admin/budaya/{$id}", [
            'category' => 'tradisi',
            'detail' => [
                'jenis_tradisi_id' => $this->jenis->id, 'process' => 'p',
                'values' => 'v', 'implementation_time' => 't',
            ],
        ])->assertOk();

        $this->assertDatabaseHas('tradisi', ['content_id' => $id]);
        $this->assertDatabaseMissing('makanan', ['content_id' => $id]);
    }

    public function test_admin_delete_cascades_details(): void
    {
        Auth::forgetGuards();
        $t = $this->adminToken();

        $id = $this->withToken($t)->postJson('/api/admin/budaya', $this->tradisiPayload())
            ->assertCreated()->json('data.id');
        ContentSource::create(['content_id' => $id, 'title' => 'Buku', 'source_url' => 'https://x.example']);
        GaleriPost::create(['user_id' => $this->user->id, 'content_id' => $id, 'title' => 'Dok', 'status' => 'approved']);

        $this->withToken($t)->deleteJson("/api/admin/budaya/{$id}")->assertOk();
        $this->withToken($t)->deleteJson("/api/admin/budaya/{$id}")->assertNotFound();

        $this->assertDatabaseMissing('cultural_contents', ['id' => $id]);
        $this->assertDatabaseMissing('tradisi', ['content_id' => $id]);
        $this->assertDatabaseMissing('content_sources', ['content_id' => $id]);
        $this->assertDatabaseMissing('galeri_posts', ['content_id' => $id]);
    }

    public function test_admin_daerah_crud_and_delete_guard(): void
    {
        Auth::forgetGuards();
        $t = $this->adminToken();

        $this->withToken($t)->postJson('/api/admin/daerah', ['nama' => 'X'])->assertUnprocessable();

        $did = $this->withToken($t)->postJson('/api/admin/daerah', [
            'nama' => 'Sunda', 'provinsi' => 'Jawa Barat', 'deskripsi' => 'd',
        ])->assertCreated()->json('data.id');

        $this->withToken($t)->getJson("/api/admin/daerah/{$did}")->assertOk()->assertJsonPath('data.nama', 'Sunda');
        $this->withToken($t)->patchJson("/api/admin/daerah/{$did}", ['provinsi' => 'Jabar'])->assertOk();
        $this->assertDatabaseHas('daerah', ['id' => $did, 'provinsi' => 'Jabar']);
        $this->withToken($t)->getJson('/api/admin/daerah/999')->assertNotFound();

        // Daerah berisi konten: hapus ditolak.
        $cid = $this->withToken($t)->postJson('/api/admin/budaya', [
            ...$this->tradisiPayload(), 'daerah_id' => $did,
        ])->assertCreated()->json('data.id');
        $this->withToken($t)->deleteJson("/api/admin/daerah/{$did}")
            ->assertStatus(409);
        $this->assertDatabaseHas('daerah', ['id' => $did]);

        // Setelah konten dihapus, daerah boleh dihapus.
        $this->withToken($t)->deleteJson("/api/admin/budaya/{$cid}")->assertOk();
        $this->withToken($t)->deleteJson("/api/admin/daerah/{$did}")->assertOk();
        $this->assertDatabaseMissing('daerah', ['id' => $did]);
    }

    private function assertDatabaseStillHasTradisi(int $id): void
    {
        $this->assertDatabaseHas('tradisi', ['content_id' => $id, 'process' => 'pawai']);
    }
}
