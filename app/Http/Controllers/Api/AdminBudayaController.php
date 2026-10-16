<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AlatMusik;
use App\Models\BajuAdat;
use App\Models\BajuAdatVariant;
use App\Models\CulturalContent;
use App\Models\Makanan;
use App\Models\Tradisi;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminBudayaController extends Controller
{
    private const CATEGORIES = ['tradisi', 'baju_adat', 'makanan', 'alat_musik'];

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'in:draft,published'],
            'daerah_id' => ['nullable', 'integer', 'exists:daerah,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $query = CulturalContent::query()->with(['daerah'])->orderByDesc('updated_at');

        foreach (['status', 'daerah_id'] as $field) {
            if (! empty($validated[$field])) {
                $query->where($field, $validated[$field]);
            }
        }

        if (! empty($validated['q'])) {
            $query->where('title', 'like', "%{$validated['q']}%");
        }

        $paginator = $query->paginate($validated['per_page'] ?? 10);

        return response()->json([
            'message' => 'Daftar konten budaya (admin).',
            'data' => $paginator->map(fn (CulturalContent $c): array => [
                'id' => $c->id,
                'category' => $c->category,
                'title' => $c->title,
                'status' => $c->status,
                'daerah' => $c->daerah ? ['id' => $c->daerah->id, 'nama' => $c->daerah->nama] : null,
            ])->values(),
            'meta' => $this->meta($paginator),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules());

        if ($validated['category'] === 'tradisi') {
            $this->validateTradisiDetail($request);
        }

        $content = DB::transaction(function () use ($validated, $request): CulturalContent {
            $content = CulturalContent::create([
                'daerah_id' => $validated['daerah_id'],
                'category' => $validated['category'],
                'title' => $validated['title'],
                'description' => $validated['description'],
                'history' => $validated['history'],
                'meaning' => $validated['meaning'],
                'main_image' => $validated['main_image'] ?? null,
                'status' => $validated['status'] ?? 'draft',
                'created_by' => $request->user()->id,
            ]);

            $this->saveDetail($content, $validated['category'], $validated['detail'] ?? []);

            return $content;
        });

        return response()->json([
            'message' => 'Konten budaya dibuat.',
            'data' => ['id' => $content->id, 'status' => $content->status],
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $content = CulturalContent::find($id);

        if (! $content) {
            return response()->json(['message' => 'Konten budaya tidak ditemukan.'], 404);
        }

        $content->load(['daerah', 'creator', 'tradisi.jenisTradisi', 'bajuAdat.variants', 'makanan', 'alatMusik.interactiveAsset', 'contentSources']);

        return response()->json([
            'message' => 'Detail konten budaya (admin).',
            'data' => [
                'id' => $content->id,
                'category' => $content->category,
                'title' => $content->title,
                'description' => $content->description,
                'history' => $content->history,
                'meaning' => $content->meaning,
                'main_image' => $content->main_image,
                'status' => $content->status,
                'daerah' => $content->daerah ? ['id' => $content->daerah->id, 'nama' => $content->daerah->nama] : null,
                'creator' => $content->creator ? ['id' => $content->creator->id, 'username' => $content->creator->username] : null,
                'detail' => $this->detailFor($content),
                'sources' => $content->contentSources->map(fn ($s): array => [
                    'id' => $s->id, 'title' => $s->title, 'source_url' => $s->source_url,
                ])->values(),
            ],
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $content = CulturalContent::find($id);

        if (! $content) {
            return response()->json(['message' => 'Konten budaya tidak ditemukan.'], 404);
        }

        $validated = $request->validate($this->rules(true));
        $oldCategory = $content->getOriginal('category');
        $newCategory = $validated['category'] ?? $oldCategory;
        $categoryChanged = $newCategory !== $oldCategory;

        if ($newCategory === 'tradisi') {
            $hasDetail = $categoryChanged
                ? false
                : Tradisi::where('content_id', $content->id)->exists();
            if (! $hasDetail) {
                $this->validateTradisiDetail($request);
            }
        }

        DB::transaction(function () use ($content, $validated, $newCategory, $categoryChanged): void {
            $content->fill(collect($validated)->except(['detail', 'category'])->toArray());

            if ($categoryChanged) {
                $this->deleteDetails($content);
                $content->category = $newCategory;
            }

            $content->save();

            if ($categoryChanged || array_key_exists('detail', $validated)) {
                $this->saveDetail($content, $content->category, $validated['detail'] ?? [], $categoryChanged);
            }
        });

        return response()->json([
            'message' => 'Konten budaya diperbarui.',
            'data' => ['id' => $content->id, 'status' => $content->fresh()->status],
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $content = CulturalContent::find($id);

        if (! $content) {
            return response()->json(['message' => 'Konten budaya tidak ditemukan.'], 404);
        }

        $content->delete();

        return response()->json(['message' => 'Konten budaya dihapus.']);
    }

    private function rules(bool $partial = false): array
    {
        $sometimes = $partial ? ['sometimes'] : ['required'];

        return [
            'daerah_id' => [...$sometimes, 'integer', 'exists:daerah,id'],
            'category' => [...$sometimes, 'string', 'in:'.implode(',', self::CATEGORIES)],
            'title' => [...$sometimes, 'string', 'max:255'],
            'description' => [...$sometimes, 'string'],
            'history' => [...$sometimes, 'string'],
            'meaning' => [...$sometimes, 'string'],
            'main_image' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'in:draft,published'],
            'detail' => ['nullable', 'array'],
            'detail.jenis_tradisi_id' => ['nullable', 'integer', 'exists:jenis_tradisi,id'],
            'detail.process' => ['nullable', 'string'],
            'detail.values' => ['nullable', 'string'],
            'detail.implementation_time' => ['nullable', 'string', 'max:255'],
            'detail.usage' => ['nullable', 'string'],
            'detail.variants' => ['nullable', 'array', 'max:10'],
            'detail.variants.*.gender' => ['required', 'string', 'in:pria,wanita', 'distinct'],
            'detail.variants.*.avatar_image' => ['nullable', 'string', 'max:255'],
            'detail.variants.*.description' => ['nullable', 'string'],
            'detail.ingredients' => ['nullable', 'string'],
            'detail.recipe' => ['nullable', 'string'],
            'detail.serving_method' => ['nullable', 'string'],
            'detail.material' => ['nullable', 'string'],
            'detail.how_to_play' => ['nullable', 'string'],
            'detail.function' => ['nullable', 'string'],
            'detail.audio' => ['nullable', 'string', 'max:255'],
            'detail.interactive_asset_id' => ['nullable', 'integer', 'exists:interactive_assets,id'],
        ];
    }

    private function validateTradisiDetail(Request $request): void
    {
        $request->validate([
            'detail.jenis_tradisi_id' => ['required', 'integer', 'exists:jenis_tradisi,id'],
            'detail.process' => ['required', 'string'],
            'detail.values' => ['required', 'string'],
            'detail.implementation_time' => ['required', 'string', 'max:255'],
        ]);
    }

    private function saveDetail(CulturalContent $content, string $category, array $detail, bool $fresh = false): void
    {
        match ($category) {
            'tradisi' => Tradisi::updateOrCreate(
                ['content_id' => $content->id],
                [
                    'jenis_tradisi_id' => $detail['jenis_tradisi_id'] ?? ($fresh ? null : $content->tradisi?->jenis_tradisi_id),
                    'process' => $detail['process'] ?? ($fresh ? null : $content->tradisi?->process),
                    'values' => $detail['values'] ?? ($fresh ? null : $content->tradisi?->values),
                    'implementation_time' => $detail['implementation_time'] ?? ($fresh ? null : $content->tradisi?->implementation_time),
                ]
            ),
            'baju_adat' => tap(
                BajuAdat::updateOrCreate(
                    ['content_id' => $content->id],
                    ['usage' => $detail['usage'] ?? ($fresh ? null : $content->bajuAdat?->usage)]
                ),
                function (BajuAdat $baju) use ($detail, $fresh): void {
                    if (array_key_exists('variants', $detail)) {
                        $baju->variants()->delete();
                        foreach ($detail['variants'] ?? [] as $v) {
                            BajuAdatVariant::create([
                                'content_id' => $baju->content_id,
                                'gender' => $v['gender'],
                                'avatar_image' => $v['avatar_image'] ?? null,
                                'description' => $v['description'] ?? null,
                            ]);
                        }
                    } elseif ($fresh) {
                        $baju->variants()->delete();
                    }
                }
            ),
            'makanan' => Makanan::updateOrCreate(
                ['content_id' => $content->id],
                [
                    'ingredients' => $detail['ingredients'] ?? ($fresh ? null : $content->makanan?->ingredients),
                    'recipe' => $detail['recipe'] ?? ($fresh ? null : $content->makanan?->recipe),
                    'serving_method' => $detail['serving_method'] ?? ($fresh ? null : $content->makanan?->serving_method),
                ]
            ),
            'alat_musik' => AlatMusik::updateOrCreate(
                ['content_id' => $content->id],
                [
                    'material' => $detail['material'] ?? ($fresh ? null : $content->alatMusik?->material),
                    'how_to_play' => $detail['how_to_play'] ?? ($fresh ? null : $content->alatMusik?->how_to_play),
                    'function' => $detail['function'] ?? ($fresh ? null : $content->alatMusik?->function),
                    'audio' => $detail['audio'] ?? ($fresh ? null : $content->alatMusik?->audio),
                    'interactive_asset_id' => $detail['interactive_asset_id'] ?? ($fresh ? null : $content->alatMusik?->interactive_asset_id),
                ]
            ),
            default => null,
        };
    }

    private function deleteDetails(CulturalContent $content): void
    {
        Tradisi::where('content_id', $content->id)->delete();
        BajuAdat::where('content_id', $content->id)->delete();
        Makanan::where('content_id', $content->id)->delete();
        AlatMusik::where('content_id', $content->id)->delete();
    }

    private function detailFor(CulturalContent $content): ?array
    {
        return match ($content->category) {
            'tradisi' => $content->tradisi ? [
                'jenis_tradisi_id' => $content->tradisi->jenis_tradisi_id,
                'process' => $content->tradisi->process,
                'values' => $content->tradisi->values,
                'implementation_time' => $content->tradisi->implementation_time,
            ] : null,
            'baju_adat' => $content->bajuAdat ? [
                'usage' => $content->bajuAdat->usage,
                'variants' => $content->bajuAdat->variants->map(fn ($v): array => [
                    'gender' => $v->gender, 'avatar_image' => $v->avatar_image, 'description' => $v->description,
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
                'interactive_asset_id' => $content->alatMusik->interactive_asset_id,
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
