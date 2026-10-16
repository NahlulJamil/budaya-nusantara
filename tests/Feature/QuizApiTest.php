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
use Tests\TestCase;

class QuizApiTest extends TestCase
{
    use RefreshDatabase;

    private Aksara $jawa;

    private Aksara $sunda;

    private QuizQuestion $q1;

    private QuizQuestion $q2;

    protected function setUp(): void
    {
        parent::setUp();

        $d = Daerah::create(['nama' => 'Jawa', 'provinsi' => 'Jawa Tengah']);

        $this->jawa = Aksara::create(['daerah_id' => $d->id, 'name' => 'Aksara Jawa', 'description' => 'desc']);
        $this->sunda = Aksara::create(['daerah_id' => $d->id, 'name' => 'Aksara Sunda']);

        $cat2 = AksaraCategory::create(['aksara_id' => $this->jawa->id, 'name' => 'Pasangan', 'sort_order' => 2]);
        $cat1 = AksaraCategory::create(['aksara_id' => $this->jawa->id, 'name' => 'Nglegena', 'sort_order' => 1]);
        AksaraCharacter::create(['category_id' => $cat1->id, 'character' => 'ha', 'latin' => 'ha']);
        AksaraCharacter::create(['category_id' => $cat2->id, 'character' => 'hna', 'latin' => 'na']);

        $this->q1 = QuizQuestion::create([
            'aksara_id' => $this->jawa->id, 'question' => 'Bacaan aksara ini?',
            'displayed_character' => 'ha', 'correct_answer' => 'ha',
            'explanation' => 'Karena bentuknya ha.', 'generated_by' => 'manual',
        ]);
        $this->q2 = QuizQuestion::create([
            'aksara_id' => $this->jawa->id, 'question' => 'Bacaan lainnya?',
            'displayed_character' => 'na', 'correct_answer' => 'na', 'generated_by' => 'ai',
        ]);

        $this->catNglegena = $cat1;
        $this->catPasangan = $cat2;
    }

    private AksaraCategory $catNglegena;

    private AksaraCategory $catPasangan;

    public function test_aksara_public_index_show_and_category(): void
    {
        $this->getJson('/api/aksara')->assertOk()->assertJsonPath('meta.total', 2);

        $this->getJson("/api/aksara?daerah_id={$this->jawa->daerah_id}")
            ->assertOk()->assertJsonPath('meta.total', 2);

        $this->getJson('/api/aksara?daerah_id=999')->assertUnprocessable();
        $this->getJson('/api/aksara/999')->assertNotFound();

        $show = $this->getJson("/api/aksara/{$this->jawa->id}")->assertOk();
        $show->assertJsonPath('data.name', 'Aksara Jawa')
            ->assertJsonPath('data.daerah.nama', 'Jawa')
            ->assertJsonCount(2, 'data.categories')
            ->assertJsonPath('data.categories.0.name', 'Nglegena')
            ->assertJsonPath('data.categories.0.characters.0.latin', 'ha');

        $this->getJson("/api/aksara/{$this->jawa->id}/kategori/{$this->catNglegena->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Nglegena')
            ->assertJsonCount(1, 'data.characters');

        // Kategori milik aksara lain tidak boleh diintip lewat aksara ini.
        $this->getJson("/api/aksara/{$this->sunda->id}/kategori/{$this->catNglegena->id}")->assertNotFound();
        $this->getJson("/api/aksara/{$this->jawa->id}/kategori/999")->assertNotFound();
    }

    public function test_kuis_questions_hide_answers_and_handle_empty(): void
    {
        $r = $this->getJson("/api/aksara/{$this->jawa->id}/kuis")->assertOk();
        $r->assertJsonPath('data.aksara.name', 'Aksara Jawa')
            ->assertJsonCount(2, 'data.soal')
            ->assertJsonPath('data.soal.0.displayed_character', 'ha')
            ->assertJsonMissingPath('data.soal.0.correct_answer')
            ->assertJsonMissingPath('data.soal.1.explanation');
        $this->assertStringNotContainsString('Karena bentuknya ha.', $r->getContent());

        // Aksara tanpa soal: daftar kosong, bukan error.
        $this->getJson("/api/aksara/{$this->sunda->id}/kuis")
            ->assertOk()->assertJsonCount(0, 'data.soal');

        $this->getJson('/api/aksara/999/kuis')->assertNotFound();
    }

    public function test_jawab_requires_login_and_evaluates_server_side(): void
    {
        $this->postJson("/api/kuis/{$this->q1->id}/jawab", ['user_answer' => 'ha'])->assertUnauthorized();

        $user = User::factory()->create();
        $token = $user->createToken('t')->plainTextToken;

        $this->withToken($token)->postJson('/api/kuis/999/jawab', ['user_answer' => 'ha'])->assertNotFound();
        $this->withToken($token)->postJson("/api/kuis/{$this->q1->id}/jawab", [])->assertUnprocessable();

        $benar = $this->withToken($token)->postJson("/api/kuis/{$this->q1->id}/jawab", ['user_answer' => '  HA '])
            ->assertOk();
        $benar->assertJsonPath('data.attempt.is_correct', true)
            ->assertJsonPath('data.correct_answer', 'ha')
            ->assertJsonPath('data.explanation', 'Karena bentuknya ha.');

        // Client memalsukan is_correct=true dengan jawaban salah → backend tetap menilai salah.
        $salah = $this->withToken($token)->postJson("/api/kuis/{$this->q1->id}/jawab", [
            'user_answer' => 'na', 'is_correct' => true,
        ])->assertOk();
        $salah->assertJsonPath('data.attempt.is_correct', false);

        $this->assertDatabaseHas('quiz_attempts', [
            'user_id' => $user->id, 'question_id' => $this->q1->id,
            'user_answer' => 'na', 'is_correct' => false,
        ]);
    }

    public function test_riwayat_only_own_with_pagination(): void
    {
        $u1 = User::factory()->create();
        $u2 = User::factory()->create();
        QuizAttempt::create(['user_id' => $u1->id, 'question_id' => $this->q1->id, 'user_answer' => 'ha', 'is_correct' => true, 'answered_at' => now()]);
        QuizAttempt::create(['user_id' => $u2->id, 'question_id' => $this->q2->id, 'user_answer' => 'xx', 'is_correct' => false, 'answered_at' => now()]);

        $this->getJson('/api/kuis/riwayat')->assertUnauthorized();

        $r = $this->withToken($u1->createToken('t')->plainTextToken)->getJson('/api/kuis/riwayat')->assertOk();
        $r->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.user_answer', 'ha')
            ->assertJsonPath('data.0.question.displayed_character', 'ha');

        $this->withToken($u1->createToken('t2')->plainTextToken)->getJson('/api/kuis/riwayat?per_page=1')
            ->assertOk()->assertJsonPath('meta.per_page', 1);
    }
}
