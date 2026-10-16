<?php

namespace Tests\Feature;

use App\Models\Aksara;
use App\Models\AksaraCategory;
use App\Models\AksaraCharacter;
use App\Models\Daerah;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class AdminAksaraApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $user;

    private Daerah $d1;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create();
        $this->admin->forceFill(['role' => 'admin'])->save();
        $this->user = User::factory()->create();
        $this->d1 = Daerah::create(['nama' => 'Jawa', 'provinsi' => 'Jawa Tengah']);
    }

    private function adminToken(): string
    {
        Auth::forgetGuards();

        return $this->admin->createToken('t')->plainTextToken;
    }

    private function userToken(): string
    {
        Auth::forgetGuards();

        return $this->user->createToken('t')->plainTextToken;
    }

    public function test_guard_blocks_anon_and_biasa(): void
    {
        $this->getJson('/api/admin/aksara')->assertUnauthorized();
        $this->postJson('/api/admin/aksara', [])->assertUnauthorized();

        $t = $this->userToken();
        $this->withToken($t)->getJson('/api/admin/aksara')->assertForbidden();
        $this->withToken($t)->postJson('/api/admin/aksara', [])->assertForbidden();
        $this->withToken($t)->postJson('/api/admin/aksara/1/kategori', [])->assertForbidden();
        $this->withToken($t)->postJson('/api/admin/kategori/1/karakter', [])->assertForbidden();
        $this->withToken($t)->postJson('/api/admin/aksara/1/soal', [])->assertForbidden();
        $this->withToken($t)->deleteJson('/api/admin/soal/1')->assertForbidden();
    }

    public function test_kelola_materi_aksara(): void
    {
        $t = $this->adminToken();

        $this->withToken($t)->postJson('/api/admin/aksara', ['name' => 'X'])->assertUnprocessable();
        $this->withToken($t)->postJson('/api/admin/aksara', ['name' => 'X', 'daerah_id' => 999])
            ->assertUnprocessable()->assertJsonValidationErrors(['daerah_id']);

        $id = $this->withToken($t)->postJson('/api/admin/aksara', [
            'daerah_id' => $this->d1->id, 'name' => 'Aksara Jawa', 'history' => 'lama',
        ])->assertCreated()->json('data.id');

        $this->withToken($t)->getJson('/api/admin/aksara')->assertOk()->assertJsonPath('meta.total', 1);
        $this->withToken($t)->getJson("/api/admin/aksara?daerah_id={$this->d1->id}")->assertOk()->assertJsonPath('meta.total', 1);
        $this->withToken($t)->patchJson("/api/admin/aksara/{$id}", ['name' => 'Aksara Jawa Baru'])->assertOk();
        $this->assertDatabaseHas('aksara', ['id' => $id, 'name' => 'Aksara Jawa Baru']);
        $this->withToken($t)->getJson('/api/admin/aksara/999')->assertNotFound();
    }

    public function test_kelola_kategori_dan_karakter_unicode(): void
    {
        $t = $this->adminToken();
        $aksara = Aksara::create(['daerah_id' => $this->d1->id, 'name' => 'Aksara Jawa']);

        $cat = $this->withToken($t)->postJson("/api/admin/aksara/{$aksara->id}/kategori", ['name' => 'Nglegena'])
            ->assertCreated()->json('data.id');
        $this->withToken($t)->postJson('/api/admin/aksara/999/kategori', ['name' => 'X'])->assertNotFound();

        $this->withToken($t)->postJson("/api/admin/kategori/{$cat}/karakter", ['latin' => 'ha'])
            ->assertUnprocessable()->assertJsonValidationErrors(['character']);
        $this->withToken($t)->postJson('/api/admin/kategori/999/karakter', ['character' => 'ha'])->assertNotFound();

        // Karakter Unicode harus utuh saat disimpan dan dikembalikan.
        $char = $this->withToken($t)->postJson("/api/admin/kategori/{$cat}/karakter", [
            'character' => 'ꦲ', 'latin' => 'ha',
        ])->assertCreated();
        $char->assertJsonPath('data.character', 'ꦲ');
        $this->assertSame('ꦲ', AksaraCharacter::find($char->json('data.id'))->character);

        $cid = $char->json('data.id');
        $this->withToken($t)->patchJson("/api/admin/karakter/{$cid}", ['latin' => 'ha murda'])->assertOk();
        $this->withToken($t)->getJson("/api/admin/karakter/{$cid}")->assertOk()->assertJsonPath('data.latin', 'ha murda');
        $this->withToken($t)->getJson("/api/admin/kategori/{$cat}")->assertOk()->assertJsonCount(1, 'data.characters');

        $this->withToken($t)->deleteJson("/api/admin/karakter/{$cid}")->assertOk();
        $this->assertDatabaseMissing('aksara_characters', ['id' => $cid]);
        $this->withToken($t)->deleteJson("/api/admin/kategori/{$cat}")->assertOk();
        $this->assertDatabaseMissing('aksara_categories', ['id' => $cat]);
        $this->withToken($t)->deleteJson('/api/admin/kategori/999')->assertNotFound();
    }

    public function test_kelola_bank_soal_dan_aturan_hapus(): void
    {
        $t = $this->adminToken();
        $aksara = Aksara::create(['daerah_id' => $this->d1->id, 'name' => 'Aksara Jawa']);

        $this->withToken($t)->postJson("/api/admin/aksara/{$aksara->id}/soal", [
            'question' => 'Apa?', 'displayed_character' => 'ha',
        ])->assertUnprocessable()->assertJsonValidationErrors(['correct_answer']);
        $this->withToken($t)->postJson('/api/admin/aksara/999/soal', [
            'question' => 'Q', 'displayed_character' => 'ha', 'correct_answer' => 'ha',
        ])->assertNotFound();

        $qid = $this->withToken($t)->postJson("/api/admin/aksara/{$aksara->id}/soal", [
            'question' => 'Bacaan ini?', 'displayed_character' => 'ha',
            'correct_answer' => 'ha', 'explanation' => 'Karena ha.', 'generated_by' => 'ai',
        ])->assertCreated()->json('data.id');

        // Admin boleh melihat jawaban benar; publik tidak.
        $this->withToken($t)->getJson("/api/admin/soal/{$qid}")->assertOk()
            ->assertJsonPath('data.correct_answer', 'ha');
        $this->getJson("/api/aksara/{$aksara->id}/kuis")->assertOk()
            ->assertJsonMissingPath('data.soal.0.correct_answer');
        $this->assertStringNotContainsString(
            'Karena ha.',
            $this->getJson("/api/aksara/{$aksara->id}/kuis")->getContent()
        );

        $this->withToken($t)->patchJson("/api/admin/soal/{$qid}", ['explanation' => 'Baru'])->assertOk();
        $this->assertDatabaseHas('quiz_questions', ['id' => $qid, 'explanation' => 'Baru']);

        // Soal ber-riwayat tidak boleh dihapus.
        QuizAttempt::create([
            'user_id' => $this->user->id, 'question_id' => $qid,
            'user_answer' => 'ha', 'is_correct' => true, 'answered_at' => now(),
        ]);
        $this->withToken($t)->deleteJson("/api/admin/soal/{$qid}")->assertStatus(409);
        $this->assertDatabaseHas('quiz_questions', ['id' => $qid]);

        // Aksara ber-riwayat juga tidak boleh dihapus.
        $this->withToken($t)->deleteJson("/api/admin/aksara/{$aksara->id}")->assertStatus(409);
        $this->assertDatabaseHas('aksara', ['id' => $aksara->id]);

        // Soal dan aksara bersih dapat dihapus (cascade kategori/karakter/soal).
        $cat = AksaraCategory::create(['aksara_id' => $aksara->id, 'name' => 'Nglegena']);
        $ch = AksaraCharacter::create(['category_id' => $cat->id, 'character' => 'ꦲ']);
        $q2 = QuizQuestion::create([
            'aksara_id' => $aksara->id, 'question' => 'Q2',
            'displayed_character' => 'na', 'correct_answer' => 'na',
        ]);
        $this->withToken($t)->deleteJson("/api/admin/soal/{$q2->id}")->assertOk();
        $this->assertDatabaseMissing('quiz_questions', ['id' => $q2->id]);

        QuizAttempt::where('question_id', $qid)->delete();
        $this->withToken($t)->deleteJson("/api/admin/aksara/{$aksara->id}")->assertOk();
        $this->assertDatabaseMissing('aksara', ['id' => $aksara->id]);
        $this->assertDatabaseMissing('aksara_categories', ['id' => $cat->id]);
        $this->assertDatabaseMissing('aksara_characters', ['id' => $ch->id]);
        $this->assertDatabaseMissing('quiz_questions', ['id' => $qid]);
    }
}
