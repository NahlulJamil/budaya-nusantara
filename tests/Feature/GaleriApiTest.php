<?php

namespace Tests\Feature;

use App\Models\CulturalContent;
use App\Models\Daerah;
use App\Models\GaleriMedia;
use App\Models\GaleriPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class GaleriApiTest extends TestCase
{
    use RefreshDatabase;

    private CulturalContent $pub;

    private CulturalContent $draft;

    private User $u1;

    private User $u2;

    private User $admin;

    private GaleriPost $pApproved1;

    private GaleriPost $pPending;

    private GaleriPost $pRejected;

    private GaleriPost $pApproved2;

    protected function setUp(): void
    {
        parent::setUp();

        $d = Daerah::create(['nama' => 'Jawa', 'provinsi' => 'Jawa Tengah']);
        $this->pub = CulturalContent::create([
            'daerah_id' => $d->id, 'category' => 'makanan', 'title' => 'Gudeg',
            'description' => 'd', 'history' => 'h', 'meaning' => 'm', 'status' => 'published',
        ]);
        $this->draft = CulturalContent::create([
            'daerah_id' => $d->id, 'category' => 'makanan', 'title' => 'Sembunyi',
            'description' => 'd', 'history' => 'h', 'meaning' => 'm', 'status' => 'draft',
        ]);

        $this->u1 = User::factory()->create();
        $this->u2 = User::factory()->create();
        $this->admin = User::factory()->create();
        $this->admin->forceFill(['role' => 'admin'])->save();

        $this->pApproved1 = GaleriPost::create([
            'user_id' => $this->u1->id, 'content_id' => $this->pub->id,
            'title' => 'Setuju 1', 'status' => 'approved',
        ]);
        GaleriMedia::create(['gallery_post_id' => $this->pApproved1->id, 'file_path' => 'galeri/x.jpg', 'media_type' => 'image']);
        $this->pPending = GaleriPost::create([
            'user_id' => $this->u1->id, 'content_id' => $this->pub->id,
            'title' => 'Tunggu', 'status' => 'pending',
        ]);
        $this->pRejected = GaleriPost::create([
            'user_id' => $this->u2->id, 'content_id' => $this->pub->id,
            'title' => 'Tolak', 'status' => 'rejected',
        ]);
        $this->pApproved2 = GaleriPost::create([
            'user_id' => $this->u2->id, 'content_id' => $this->pub->id,
            'title' => 'Setuju 2', 'status' => 'approved',
        ]);
    }

    private function token(User $u): string
    {
        return $u->createToken('t')->plainTextToken;
    }

    public function test_public_index_and_show_only_approved(): void
    {
        $titles = fn ($r) => collect($r->json('data'))->pluck('title');

        $all = $this->getJson('/api/galeri')->assertOk();
        $this->assertTrue($titles($all)->contains('Setuju 1'));
        $this->assertTrue($titles($all)->contains('Setuju 2'));
        $this->assertFalse($titles($all)->contains('Tunggu'));
        $this->assertFalse($titles($all)->contains('Tolak'));

        $this->getJson("/api/galeri?content_id={$this->pub->id}")->assertOk()->assertJsonPath('meta.total', 2);
        $this->getJson('/api/galeri?content_id=999')->assertUnprocessable();

        $this->getJson("/api/galeri/{$this->pApproved1->id}")
            ->assertOk()
            ->assertJsonPath('data.title', 'Setuju 1')
            ->assertJsonPath('data.author.username', $this->u1->username)
            ->assertJsonPath('data.content.title', 'Gudeg')
            ->assertJsonCount(1, 'data.media')
            ->assertJsonMissingPath('data.author.email');

        $this->getJson("/api/galeri/{$this->pPending->id}")->assertNotFound();
        $this->getJson("/api/galeri/{$this->pRejected->id}")->assertNotFound();
        $this->getJson('/api/galeri/999')->assertNotFound();
    }

    public function test_mine_only_own_and_requires_login(): void
    {
        $this->getJson('/api/galeri-saya')->assertUnauthorized();

        $r = $this->withToken($this->token($this->u1))->getJson('/api/galeri-saya')->assertOk();
        $titles = collect($r->json('data'))->pluck('title');
        $this->assertTrue($titles->contains('Setuju 1') && $titles->contains('Tunggu'));
        $this->assertFalse($titles->contains('Setuju 2'));
        $this->assertIsString($r->json('data.0.created_at'));
    }

    public function test_store_publishes_immediately_and_validates(): void
    {
        $this->postJson('/api/galeri', ['title' => 'x', 'content_id' => $this->pub->id])->assertUnauthorized();

        $t = $this->token($this->u1);
        $this->withToken($t)->postJson('/api/galeri', [])->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'content_id']);

        // Konten draft tidak bisa dijadikan rujukan.
        $this->withToken($t)->postJson('/api/galeri', [
            'title' => 'Ref draft', 'content_id' => $this->draft->id,
        ])->assertUnprocessable()->assertJsonValidationErrors(['content_id']);

        // Upaya memalsukan status rejected diabaikan: kiriman langsung approved.
        $r = $this->withToken($t)->postJson('/api/galeri', [
            'title' => 'Baru', 'content_id' => $this->pub->id, 'status' => 'rejected',
            'caption' => 'cerita', 'location' => 'Pasar', 'activity_date' => '2026-10-01',
        ])->assertCreated();
        $r->assertJsonPath('data.status', 'approved');
        $this->assertDatabaseHas('galeri_posts', ['title' => 'Baru', 'status' => 'approved', 'user_id' => $this->u1->id]);
    }

    public function test_store_upload_valid_and_rejects_invalid(): void
    {
        Storage::fake('public');
        $t = $this->token($this->u1);

        $r = $this->withToken($t)->postJson('/api/galeri', [
            'title' => 'Dengan foto', 'content_id' => $this->pub->id,
            'media' => [UploadedFile::fake()->image('foto.jpg')],
            // Path arbitrer dari client harus diabaikan (tidak ada kolom input untuknya).
            'file_path' => '/etc/passwd',
        ])->assertCreated();

        $path = $r->json('data.media.0.file_path');
        $this->assertStringStartsWith('galeri/', $path);
        Storage::disk('public')->assertExists($path);
        $this->assertDatabaseHas('galeri_media', ['file_path' => $path, 'media_type' => 'image']);

        // Kiriman yang baru diunggah langsung terlihat di galeri publik.
        $this->getJson('/api/galeri')
            ->assertOk()
            ->assertJsonFragment(['title' => 'Dengan foto', 'status' => 'approved']);

        $this->withToken($t)->postJson('/api/galeri', [
            'title' => 'File jahat', 'content_id' => $this->pub->id,
            'media' => [UploadedFile::fake()->create('cms.php', 100, 'application/x-php')],
        ])->assertUnprocessable()->assertJsonValidationErrors(['media.0']);
    }

    public function test_report_and_duplicate_handling(): void
    {
        $this->postJson("/api/galeri/{$this->pApproved1->id}/laporkan", ['reason' => 'x'])->assertUnauthorized();

        $t = $this->token($this->u2);
        $this->withToken($t)->postJson("/api/galeri/{$this->pApproved1->id}/laporkan", [])
            ->assertUnprocessable()->assertJsonValidationErrors(['reason']);

        $this->withToken($t)->postJson("/api/galeri/{$this->pApproved1->id}/laporkan", [
            'reason' => 'Spam', 'description' => 'Iklan',
        ])->assertCreated()->assertJsonPath('data.status', 'pending');

        // Laporan kedua dari user yang sama untuk kiriman yang sama.
        $this->withToken($t)->postJson("/api/galeri/{$this->pApproved1->id}/laporkan", ['reason' => 'Lagi'])
            ->assertStatus(409)->assertJsonPath('message', 'Anda sudah melaporkan kiriman ini.');

        $this->withToken($t)->postJson('/api/galeri/999/laporkan', ['reason' => 'x'])->assertNotFound();
    }

    public function test_admin_moderation_vs_biasa(): void
    {
        $tUser = $this->token($this->u1);
        $tAdmin = $this->token($this->admin);

        $this->getJson('/api/admin/galeri/pending')->assertUnauthorized();
        $this->withToken($tUser)->getJson('/api/admin/galeri/pending')->assertForbidden();
        $this->withToken($tUser)->patchJson("/api/admin/galeri/{$this->pPending->id}/status", ['status' => 'approved'])->assertForbidden();

        // Ganti identitas: bersihkan cache guard dalam instance aplikasi yang sama.
        Auth::forgetGuards();
        $list = $this->withToken($tAdmin)->getJson('/api/admin/galeri/pending')->assertOk();
        $list->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.title', 'Tunggu');

        $this->withToken($tAdmin)->patchJson("/api/admin/galeri/{$this->pPending->id}/status", ['status' => 'salah'])
            ->assertUnprocessable();
        $this->withToken($tAdmin)->patchJson('/api/admin/galeri/999/status', ['status' => 'approved'])->assertNotFound();

        $this->withToken($tAdmin)->patchJson("/api/admin/galeri/{$this->pPending->id}/status", ['status' => 'approved'])
            ->assertOk()->assertJsonPath('data.status', 'approved');

        // Setelah disetujui, publik dapat melihatnya.
        $this->getJson("/api/galeri/{$this->pPending->id}")->assertOk()->assertJsonPath('data.title', 'Tunggu');
    }
}
