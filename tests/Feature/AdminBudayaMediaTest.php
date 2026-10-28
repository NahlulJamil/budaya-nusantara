<?php

namespace Tests\Feature;

use App\Models\AlatMusik;
use App\Models\BajuAdat;
use App\Models\BajuAdatVariant;
use App\Models\CulturalContent;
use App\Models\Daerah;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class AdminBudayaMediaTest extends TestCase
{
    use RefreshDatabase;

    private string $token;

    private Daerah $daerah;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();

        Auth::forgetGuards();

        $this->token = $admin->createToken('admin')->plainTextToken;
        $this->daerah = Daerah::create(['nama' => 'Jawa', 'provinsi' => 'Jawa Tengah']);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function content(array $overrides = []): CulturalContent
    {
        return CulturalContent::create(array_merge([
            'daerah_id' => $this->daerah->id,
            'category' => 'makanan',
            'title' => 'Konten',
            'description' => 'd',
            'history' => 'h',
            'meaning' => 'm',
            'main_image' => null,
            'status' => 'draft',
        ], $overrides));
    }

    private function managedImage(string $name = 'lama.jpg'): string
    {
        $path = 'budaya/uploads/images/'.$name;
        Storage::disk('public')->put($path, 'image-bytes');

        return $path;
    }

    private function managedAudio(string $name = 'lama.mp3'): string
    {
        $path = 'budaya/uploads/audio/'.$name;
        Storage::disk('public')->put($path, 'audio-bytes');

        return $path;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function patchContent(int $id, array $payload): TestResponse
    {
        return $this->withToken($this->token)->patchJson("/api/admin/budaya/{$id}", $payload);
    }

    public function test_create_with_empty_image_and_audio_stores_null(): void
    {
        $response = $this->withToken($this->token)->postJson('/api/admin/budaya', [
            'daerah_id' => $this->daerah->id,
            'category' => 'alat_musik',
            'title' => 'Angklung',
            'description' => 'd',
            'history' => 'h',
            'meaning' => 'm',
            'main_image' => '   ',
            'detail' => ['audio' => ''],
        ])->assertCreated();

        $id = $response->json('data.id');

        $this->assertDatabaseHas('cultural_contents', ['id' => $id, 'main_image' => null]);
        $this->assertDatabaseHas('alat_musik', ['content_id' => $id, 'audio' => null]);
    }

    public function test_create_with_managed_path_keeps_file(): void
    {
        $path = $this->managedImage('baru.jpg');

        $this->withToken($this->token)->postJson('/api/admin/budaya', [
            'daerah_id' => $this->daerah->id,
            'category' => 'makanan',
            'title' => 'Konten',
            'description' => 'd',
            'history' => 'h',
            'meaning' => 'm',
            'main_image' => $path,
        ])->assertCreated();

        Storage::disk('public')->assertExists($path);
    }

    public function test_update_keeps_existing_managed_image_when_not_replaced(): void
    {
        $path = $this->managedImage();
        $content = $this->content(['main_image' => $path]);

        $this->patchContent($content->id, ['title' => 'Judul Baru'])->assertOk();

        $this->assertSame($path, $content->fresh()->main_image);
        Storage::disk('public')->assertExists($path);
    }

    public function test_update_replaces_managed_image_and_deletes_old_file(): void
    {
        $old = $this->managedImage('lama.jpg');
        $new = $this->managedImage('baru.jpg');
        $content = $this->content(['main_image' => $old]);

        $this->patchContent($content->id, ['main_image' => $new])->assertOk();

        $this->assertSame($new, $content->fresh()->main_image);
        Storage::disk('public')->assertMissing($old);
        Storage::disk('public')->assertExists($new);
    }

    public function test_update_clears_managed_image_and_deletes_file(): void
    {
        $old = $this->managedImage();
        $content = $this->content(['main_image' => $old]);

        $this->patchContent($content->id, ['main_image' => ''])->assertOk();

        $this->assertNull($content->fresh()->main_image);
        Storage::disk('public')->assertMissing($old);
    }

    public function test_update_from_storage_prefixed_path_cleans_managed_file(): void
    {
        $old = $this->managedImage();
        $new = $this->managedImage('baru.jpg');
        $content = $this->content(['main_image' => '/storage/'.$old]);

        $this->patchContent($content->id, ['main_image' => $new])->assertOk();

        Storage::disk('public')->assertMissing($old);
        Storage::disk('public')->assertExists($new);
    }

    public function test_update_never_deletes_external_or_legacy_paths(): void
    {
        $legacy = 'budaya/sekaten.jpg';
        Storage::disk('public')->put($legacy, 'legacy-bytes');

        $cases = [
            'https://example.com/foto.jpg',
            '/storage/'.$legacy,
        ];

        foreach ($cases as $index => $reference) {
            $content = $this->content(['main_image' => $reference, 'title' => 'Konten '.$index]);
            $new = $this->managedImage('baru-'.$index.'.jpg');

            $this->patchContent($content->id, ['main_image' => $new])->assertOk();

            $this->assertSame($new, $content->fresh()->main_image);
        }

        Storage::disk('public')->assertExists($legacy);
    }

    public function test_shared_media_file_is_not_deleted_until_last_reference_removed(): void
    {
        $path = $this->managedImage('bersama.jpg');
        $first = $this->content(['main_image' => $path, 'title' => 'Satu']);
        $second = $this->content(['main_image' => $path, 'title' => 'Dua']);

        $this->withToken($this->token)->deleteJson("/api/admin/budaya/{$first->id}")->assertOk();

        Storage::disk('public')->assertExists($path);

        $this->withToken($this->token)->deleteJson("/api/admin/budaya/{$second->id}")->assertOk();

        Storage::disk('public')->assertMissing($path);
    }

    public function test_destroy_cleans_managed_image_audio_and_avatar(): void
    {
        $image = $this->managedImage();
        $audio = $this->managedAudio();
        $avatar = $this->managedImage('avatar.jpg');

        $musik = $this->content(['main_image' => $image, 'category' => 'alat_musik', 'title' => 'Musik']);
        AlatMusik::create(['content_id' => $musik->id, 'audio' => $audio]);

        $baju = $this->content(['category' => 'baju_adat', 'title' => 'Baju']);
        BajuAdat::create(['content_id' => $baju->id, 'usage' => 'adat']);
        BajuAdatVariant::create([
            'content_id' => $baju->id,
            'gender' => 'pria',
            'avatar_image' => $avatar,
        ]);

        $this->withToken($this->token)->deleteJson("/api/admin/budaya/{$musik->id}")->assertOk();
        $this->withToken($this->token)->deleteJson("/api/admin/budaya/{$baju->id}")->assertOk();

        Storage::disk('public')->assertMissing($image);
        Storage::disk('public')->assertMissing($audio);
        Storage::disk('public')->assertMissing($avatar);
    }

    public function test_audio_replacement_and_clearing_deletes_old_file(): void
    {
        $old = $this->managedAudio('lama.mp3');
        $new = $this->managedAudio('baru.mp3');
        $content = $this->content(['category' => 'alat_musik']);
        AlatMusik::create(['content_id' => $content->id, 'audio' => $old, 'material' => 'bambu']);

        $this->patchContent($content->id, ['detail' => ['audio' => $new]])->assertOk();

        $this->assertSame($new, AlatMusik::find($content->id)->audio);
        Storage::disk('public')->assertMissing($old);
        Storage::disk('public')->assertExists($new);

        $this->patchContent($content->id, ['detail' => ['audio' => '']])->assertOk();

        $this->assertNull(AlatMusik::find($content->id)->audio);
        Storage::disk('public')->assertMissing($new);
    }

    public function test_audio_update_without_audio_field_keeps_existing_file(): void
    {
        $audio = $this->managedAudio();
        $content = $this->content(['category' => 'alat_musik']);
        AlatMusik::create(['content_id' => $content->id, 'audio' => $audio]);

        $this->patchContent($content->id, ['detail' => ['material' => 'kayu']])->assertOk();

        $this->assertSame($audio, AlatMusik::find($content->id)->audio);
        Storage::disk('public')->assertExists($audio);
    }

    public function test_variant_avatar_replacement_and_removal_cleans_file(): void
    {
        $old = $this->managedImage('avatar-lama.jpg');
        $new = $this->managedImage('avatar-baru.jpg');
        $content = $this->content(['category' => 'baju_adat']);
        BajuAdat::create(['content_id' => $content->id, 'usage' => 'adat']);
        BajuAdatVariant::create(['content_id' => $content->id, 'gender' => 'pria', 'avatar_image' => $old]);

        $this->patchContent($content->id, [
            'detail' => ['variants' => [['gender' => 'pria', 'avatar_image' => $new]]],
        ])->assertOk();

        Storage::disk('public')->assertMissing($old);
        Storage::disk('public')->assertExists($new);

        $this->patchContent($content->id, [
            'detail' => ['variants' => []],
        ])->assertOk();

        $this->assertSame(0, BajuAdatVariant::where('content_id', $content->id)->count());
        Storage::disk('public')->assertMissing($new);
    }

    public function test_variant_avatar_external_url_can_be_replaced_without_file_errors(): void
    {
        $external = 'https://example.com/avatar.jpg';
        $content = $this->content(['category' => 'baju_adat']);
        BajuAdat::create(['content_id' => $content->id, 'usage' => 'adat']);
        BajuAdatVariant::create(['content_id' => $content->id, 'gender' => 'pria', 'avatar_image' => $external]);

        $new = $this->managedImage('avatar-baru.jpg');

        $this->patchContent($content->id, [
            'detail' => ['variants' => [['gender' => 'pria', 'avatar_image' => $new]]],
        ])->assertOk();

        Storage::disk('public')->assertExists($new);
    }

    public function test_category_change_cleans_old_detail_media(): void
    {
        $avatar = $this->managedImage('avatar.jpg');
        $content = $this->content(['category' => 'baju_adat']);
        BajuAdat::create(['content_id' => $content->id, 'usage' => 'adat']);
        BajuAdatVariant::create(['content_id' => $content->id, 'gender' => 'pria', 'avatar_image' => $avatar]);

        $this->patchContent($content->id, ['category' => 'makanan'])->assertOk();

        $this->assertSame('makanan', $content->fresh()->category);
        $this->assertSame(0, BajuAdatVariant::where('content_id', $content->id)->count());
        Storage::disk('public')->assertMissing($avatar);
    }

    public function test_failed_validation_keeps_old_media(): void
    {
        $path = $this->managedImage();
        $content = $this->content(['main_image' => $path]);

        $this->patchContent($content->id, [
            'category' => 'kategori-tidak-ada',
            'main_image' => 'budaya/uploads/images/baru.jpg',
        ])->assertUnprocessable();

        $this->assertSame($path, $content->fresh()->main_image);
        Storage::disk('public')->assertExists($path);
    }

    public function test_media_referenced_by_unrelated_record_is_kept(): void
    {
        $shared = $this->managedImage('bersama.jpg');
        $other = $this->content(['category' => 'baju_adat', 'title' => 'Lain']);
        BajuAdat::create(['content_id' => $other->id, 'usage' => 'adat']);
        BajuAdatVariant::create([
            'content_id' => $other->id,
            'gender' => 'wanita',
            'avatar_image' => $shared,
        ]);

        $content = $this->content(['main_image' => $shared]);
        $new = $this->managedImage('baru.jpg');

        $this->patchContent($content->id, ['main_image' => $new])->assertOk();

        Storage::disk('public')->assertExists($shared);
        Storage::disk('public')->assertExists($new);
    }
}
