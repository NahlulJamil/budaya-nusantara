<?php

namespace Tests\Feature;

use App\Models\AlatMusik;
use App\Models\BajuAdat;
use App\Models\BajuAdatVariant;
use App\Models\ContentSource;
use App\Models\CulturalContent;
use App\Models\Daerah;
use App\Models\InteractiveAsset;
use App\Models\JenisTradisi;
use App\Models\Makanan;
use App\Models\Tradisi;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicApiTest extends TestCase
{
    use RefreshDatabase;

    private Daerah $d1;

    private Daerah $d2;

    private CulturalContent $c1;

    private CulturalContent $c2;

    private CulturalContent $c3draft;

    private CulturalContent $c4;

    private CulturalContent $c5;

    protected function setUp(): void
    {
        parent::setUp();

        $this->d1 = Daerah::create(['nama' => 'Sunda', 'provinsi' => 'Jawa Barat', 'deskripsi' => 'Tanah Sunda']);
        $this->d2 = Daerah::create(['nama' => 'Denpasar', 'provinsi' => 'Bali']);

        $this->c1 = CulturalContent::create([
            'daerah_id' => $this->d1->id, 'category' => 'tradisi', 'title' => 'Seren Taun',
            'description' => 'd', 'history' => 'h', 'meaning' => 'm', 'status' => 'published',
        ]);
        $jenis = JenisTradisi::create(['nama' => 'Upacara Adat']);
        Tradisi::create([
            'content_id' => $this->c1->id, 'jenis_tradisi_id' => $jenis->id,
            'process' => 'p', 'values' => 'v', 'implementation_time' => 'panen',
        ]);

        $this->c2 = CulturalContent::create([
            'daerah_id' => $this->d1->id, 'category' => 'makanan', 'title' => 'Rendang',
            'description' => 'd', 'history' => 'h', 'meaning' => 'm', 'status' => 'published',
        ]);
        Makanan::create([
            'content_id' => $this->c2->id, 'ingredients' => 'daging',
            'recipe' => 'masak lama', 'serving_method' => 'hangat',
        ]);

        $this->c3draft = CulturalContent::create([
            'daerah_id' => $this->d2->id, 'category' => 'baju_adat', 'title' => 'Kebaya Bali',
            'description' => 'd', 'history' => 'h', 'meaning' => 'm', 'status' => 'draft',
        ]);
        BajuAdat::create(['content_id' => $this->c3draft->id, 'usage' => 'upacara']);
        BajuAdatVariant::create(['content_id' => $this->c3draft->id, 'gender' => 'wanita']);

        $this->c4 = CulturalContent::create([
            'daerah_id' => $this->d2->id, 'category' => 'alat_musik', 'title' => 'Angklung',
            'description' => 'd', 'history' => 'h', 'meaning' => 'm', 'status' => 'published',
        ]);
        $asset = InteractiveAsset::create([
            'name' => 'Angklung Interaktif', 'asset_type' => 'webgl',
            'asset_path' => 'assets/angklung.glb',
            'configuration' => ['secret_key' => 'must-not-leak'],
        ]);
        AlatMusik::create([
            'content_id' => $this->c4->id, 'material' => 'bambu',
            'how_to_play' => 'digoyang', 'function' => 'pengiring',
            'audio' => 'audio/angklung.mp3', 'interactive_asset_id' => $asset->id,
        ]);

        ContentSource::create([
            'content_id' => $this->c1->id, 'title' => 'Buku Adat Sunda',
            'source_url' => 'https://example.com/seren-taun', 'author' => 'Penulis',
        ]);

        $this->c5 = CulturalContent::create([
            'daerah_id' => $this->d1->id, 'category' => 'baju_adat', 'title' => 'Kebaya Jawa',
            'description' => 'd', 'history' => 'h', 'meaning' => 'm', 'status' => 'published',
        ]);
        BajuAdat::create(['content_id' => $this->c5->id, 'usage' => 'pernikahan']);
        BajuAdatVariant::create(['content_id' => $this->c5->id, 'gender' => 'pria', 'description' => 'Beskap']);
        BajuAdatVariant::create(['content_id' => $this->c5->id, 'gender' => 'wanita', 'description' => 'Kebaya']);
    }

    public function test_daerah_index_pagination_and_search(): void
    {
        $this->getJson('/api/daerah')
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.per_page', 10);

        $this->getJson('/api/daerah?q=Sunda')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.nama', 'Sunda');

        $this->getJson('/api/daerah?q=Bali')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.provinsi', 'Bali');

        $this->getJson('/api/daerah?per_page=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 2);

        $this->getJson('/api/daerah?per_page=51')->assertUnprocessable();
    }

    public function test_daerah_show_includes_only_published_contents(): void
    {
        $response = $this->getJson("/api/daerah/{$this->d1->id}")->assertOk();

        $titles = collect($response->json('data.konten_published'))->pluck('title');
        $this->assertTrue($titles->contains('Seren Taun'));
        $this->assertTrue($titles->contains('Rendang'));

        $this->getJson('/api/daerah/999')->assertNotFound()->assertJsonPath('message', 'Daerah tidak ditemukan.');
    }

    public function test_budaya_index_hides_drafts_and_supports_filters(): void
    {
        $titles = fn ($r) => collect($r->json('data'))->pluck('title');

        $all = $this->getJson('/api/budaya')->assertOk();
        $this->assertTrue($titles($all)->contains('Seren Taun'));
        $this->assertFalse($titles($all)->contains('Kebaya Bali'));

        $byDaerah = $this->getJson("/api/budaya?daerah_id={$this->d2->id}")->assertOk();
        $this->assertEquals(['Angklung'], $titles($byDaerah)->all());

        $search = $this->getJson('/api/budaya?q=Rendang')->assertOk();
        $this->assertEquals(['Rendang'], $titles($search)->all());

        $this->getJson('/api/budaya?daerah_id=999')->assertUnprocessable();
    }

    public function test_budaya_show_with_relations_and_draft_guard(): void
    {
        $this->getJson("/api/budaya/{$this->c1->id}")
            ->assertOk()
            ->assertJsonPath('data.title', 'Seren Taun')
            ->assertJsonPath('data.daerah.nama', 'Sunda')
            ->assertJsonPath('data.detail.jenis_tradisi.nama', 'Upacara Adat')
            ->assertJsonMissingPath('data.created_by');

        $this->getJson("/api/budaya/{$this->c3draft->id}")->assertNotFound();
        $this->getJson('/api/budaya/999')->assertNotFound();
    }

    public function test_detail_per_kategori_lengkap(): void
    {
        // Tradisi: jenis + sumber referensi + daerah.
        $this->getJson("/api/budaya/{$this->c1->id}")
            ->assertOk()
            ->assertJsonPath('data.detail.process', 'p')
            ->assertJsonPath('data.detail.values', 'v')
            ->assertJsonPath('data.detail.implementation_time', 'panen')
            ->assertJsonPath('data.detail.jenis_tradisi.nama', 'Upacara Adat')
            ->assertJsonPath('data.daerah.provinsi', 'Jawa Barat')
            ->assertJsonPath('data.sources.0.title', 'Buku Adat Sunda')
            ->assertJsonPath('data.sources.0.author', 'Penulis');

        // Baju adat: usage + varian.
        $baju = $this->getJson("/api/budaya/{$this->c5->id}")->assertOk();
        $baju->assertJsonPath('data.detail.usage', 'pernikahan')
            ->assertJsonCount(2, 'data.detail.variants');
        $genders = collect($baju->json('data.detail.variants'))->pluck('gender');
        $this->assertTrue($genders->contains('pria') && $genders->contains('wanita'));

        // Makanan: bahan + resep + penyajian.
        $this->getJson("/api/budaya/{$this->c2->id}")
            ->assertOk()
            ->assertJsonPath('data.detail.ingredients', 'daging')
            ->assertJsonPath('data.detail.recipe', 'masak lama')
            ->assertJsonPath('data.detail.serving_method', 'hangat');

        // Alat musik: material + cara + fungsi + audio + aset (tanpa configuration).
        $musik = $this->getJson("/api/budaya/{$this->c4->id}")->assertOk();
        $musik->assertJsonPath('data.detail.material', 'bambu')
            ->assertJsonPath('data.detail.how_to_play', 'digoyang')
            ->assertJsonPath('data.detail.function', 'pengiring')
            ->assertJsonPath('data.detail.audio', 'audio/angklung.mp3')
            ->assertJsonPath('data.detail.interactive_asset.name', 'Angklung Interaktif')
            ->assertJsonMissingPath('data.detail.interactive_asset.configuration');
        $this->assertStringNotContainsString('must-not-leak', $musik->getContent());
    }

    public function test_kategori_filter_and_invalid_category(): void
    {
        $this->getJson('/api/kategori/tradisi')->assertOk()->assertJsonPath('data.0.title', 'Seren Taun');
        $this->getJson('/api/kategori/makanan')->assertOk()->assertJsonPath('data.0.title', 'Rendang');

        // Draft baju_adat tidak bocor ke publik, yang published tampil.
        $this->getJson('/api/kategori/baju_adat')
            ->assertOk()
            ->assertJsonPath('data.0.title', 'Kebaya Jawa')
            ->assertJsonCount(1, 'data');

        $this->getJson('/api/kategori/ngawur')
            ->assertNotFound()
            ->assertJsonPath('message', 'Kategori tidak valid.');
    }
}
