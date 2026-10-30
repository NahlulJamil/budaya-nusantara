<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CulturalContent;
use App\Models\Daerah;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CulturalContentController extends Controller
{
    private const CATEGORIES = ['tradisi', 'baju_adat', 'makanan', 'alat_musik'];

    private const DETAIL_RELATIONS = [
        'tradisi' => 'tradisi.jenisTradisi',
        'baju_adat' => 'bajuAdat.variants',
        'makanan' => 'makanan',
        'alat_musik' => 'alatMusik.interactiveAsset',
    ];

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->filtered($request, $request->validate($this->filterRules()));

        return response()->json([
            'message' => 'Daftar konten budaya.',
            'data' => $paginator->map(fn (CulturalContent $c): array => $this->summary($c))->values(),
            'meta' => $this->meta($paginator),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $content = CulturalContent::where('status', 'published')->find($id);

        if (! $content) {
            return response()->json(['message' => 'Konten budaya tidak ditemukan.'], 404);
        }

        $content->load(['daerah', 'contentSources', self::DETAIL_RELATIONS[$content->category]]);

        return response()->json([
            'message' => 'Detail konten budaya.',
            'data' => $this->full($content),
        ]);
    }

    public function byCategory(Request $request, string $kategori): JsonResponse
    {
        if (! in_array($kategori, self::CATEGORIES, true)) {
            return response()->json(['message' => 'Kategori tidak valid.'], 404);
        }

        $paginator = $this->filtered($request, $request->validate($this->filterRules()), $kategori);

        return response()->json([
            'message' => "Daftar konten kategori {$kategori}.",
            'data' => $paginator->map(fn (CulturalContent $c): array => $this->summary($c))->values(),
            'meta' => $this->meta($paginator),
        ]);
    }

    private function filterRules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:100'],
            'daerah_id' => ['nullable', 'integer', 'exists:daerah,id'],
            'provinsi' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }

    private function filtered(Request $request, array $validated, ?string $kategori = null): LengthAwarePaginator
    {
        $query = CulturalContent::query()
            ->where('status', 'published')
            ->with(['daerah']);

        if ($kategori) {
            $query->where('category', $kategori);
            $query->with([self::DETAIL_RELATIONS[$kategori]]);
        } else {
            $query->with(array_values(self::DETAIL_RELATIONS));
        }

        if (! empty($validated['daerah_id'])) {
            $query->where('daerah_id', $validated['daerah_id']);
        }

        if (! empty($validated['provinsi'])) {
            $provinsi = Daerah::provinsiVariants($validated['provinsi']);
            $query->whereHas('daerah', fn ($q) => $q->whereIn('provinsi', $provinsi));
        }

        if (! empty($validated['q'])) {
            $query->where('title', 'like', "%{$validated['q']}%");
        }

        return $query->orderBy('title')->paginate($validated['per_page'] ?? 10);
    }

    private function summary(CulturalContent $content): array
    {
        return [
            'id' => $content->id,
            'category' => $content->category,
            'title' => $content->title,
            'description' => $content->description,
            'main_image' => $content->main_image,
            'daerah' => $content->daerah ? [
                'id' => $content->daerah->id,
                'nama' => $content->daerah->nama,
                'provinsi' => $content->daerah->provinsi,
            ] : null,
            'detail' => $this->detailFor($content),
        ];
    }

    private function full(CulturalContent $content): array
    {
        return [
            ...$this->summary($content),
            'description' => $content->description,
            'history' => $content->history,
            'meaning' => $content->meaning,
            'sources' => $content->contentSources->map(fn ($s): array => [
                'id' => $s->id,
                'title' => $s->title,
                'source_url' => $s->source_url,
                'author' => $s->author,
                'description' => $s->description,
            ])->values(),
        ];
    }

    private function detailFor(CulturalContent $content): ?array
    {
        return match ($content->category) {
            'tradisi' => $content->tradisi ? [
                'process' => $content->tradisi->process,
                'values' => $content->tradisi->values,
                'implementation_time' => $content->tradisi->implementation_time,
                'jenis_tradisi' => $content->tradisi->jenisTradisi ? [
                    'id' => $content->tradisi->jenisTradisi->id,
                    'nama' => $content->tradisi->jenisTradisi->nama,
                ] : null,
            ] : null,
            'baju_adat' => $content->bajuAdat ? [
                'usage' => $content->bajuAdat->usage,
                'variants' => $content->bajuAdat->variants->map(fn ($v): array => [
                    'id' => $v->id,
                    'gender' => $v->gender,
                    'avatar_image' => $v->avatar_image,
                    'description' => $v->description,
                ])->values(),
            ] : null,
            'makanan' => $content->makanan ? [
                'ingredients' => $content->makanan->ingredients,
                'recipe' => $content->makanan->recipe,
                'serving_method' => $content->makanan->serving_method,
            ] : null,
            'alat_musik' => $content->alatMusik ? [
                'material' => $content->alatMusik->material,
                'how_to_play' => $content->alatMusik->how_to_play,
                'function' => $content->alatMusik->function,
                'audio' => $content->alatMusik->audio,
                'interactive_asset' => $content->alatMusik->interactiveAsset ? [
                    'id' => $content->alatMusik->interactiveAsset->id,
                    'name' => $content->alatMusik->interactiveAsset->name,
                    'asset_type' => $content->alatMusik->interactiveAsset->asset_type,
                    'asset_path' => $content->alatMusik->interactiveAsset->asset_path,
                    'is_active' => $content->alatMusik->interactiveAsset->is_active,
                ] : null,
            ] : null,
            default => null,
        };
    }

    private function meta(LengthAwarePaginator $p): array
    {
        return [
            'current_page' => $p->currentPage(),
            'per_page' => $p->perPage(),
            'total' => $p->total(),
            'last_page' => $p->lastPage(),
        ];
    }
}
