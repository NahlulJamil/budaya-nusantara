<?php

namespace Tests\Feature;

use App\Models\JenisTradisi;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JenisTradisiApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_options_with_list_contract(): void
    {
        JenisTradisi::create(['nama' => 'Upacara Adat']);
        JenisTradisi::create(['nama' => 'Seni Pertunjukan']);

        $this->getJson('/api/jenis-tradisi')
            ->assertOk()
            ->assertJsonPath('message', 'Daftar jenis tradisi.')
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['nama' => 'Upacara Adat'])
            ->assertJsonFragment(['nama' => 'Seni Pertunjukan'])
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.per_page', 50);
    }

    public function test_index_validates_per_page(): void
    {
        $this->getJson('/api/jenis-tradisi?per_page=0')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['per_page']);
    }
}
