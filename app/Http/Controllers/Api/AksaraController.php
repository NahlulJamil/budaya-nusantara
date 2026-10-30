<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Aksara;
use App\Models\AksaraCategory;
use App\Models\Daerah;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AksaraController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'daerah_id' => ['nullable', 'integer', 'exists:daerah,id'],
            'provinsi' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $query = Aksara::query()->with(['daerah'])->orderBy('name');

        if (! empty($validated['daerah_id'])) {
            $query->where('daerah_id', $validated['daerah_id']);
        }

        if (! empty($validated['provinsi'])) {
            $provinsi = Daerah::provinsiVariants($validated['provinsi']);
            $query->whereHas('daerah', fn ($q) => $q->whereIn('provinsi', $provinsi));
        }

        if (! empty($validated['q'])) {
            $query->where('name', 'like', "%{$validated['q']}%");
        }

        $paginator = $query->paginate($validated['per_page'] ?? 10);

        return response()->json([
            'message' => 'Daftar aksara.',
            'data' => $paginator->map(fn (Aksara $a): array => $this->summary($a))->values(),
            'meta' => $this->meta($paginator),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $aksara = Aksara::find($id);

        if (! $aksara) {
            return response()->json(['message' => 'Aksara tidak ditemukan.'], 404);
        }

        $aksara->load(['daerah', 'categories.characters', 'categories' => function ($query): void {
            $query->orderBy('sort_order');
        }]);

        return response()->json([
            'message' => 'Detail aksara.',
            'data' => $this->full($aksara),
        ]);
    }

    public function categoryDetail(int $id, int $categoryId): JsonResponse
    {
        $category = AksaraCategory::where('id', $categoryId)->where('aksara_id', $id)->first();

        if (! $category) {
            return response()->json(['message' => 'Kategori aksara tidak ditemukan.'], 404);
        }

        $category->load(['characters', 'aksara']);

        return response()->json([
            'message' => 'Detail kategori aksara.',
            'data' => [
                'id' => $category->id,
                'aksara_id' => $category->aksara_id,
                'aksara' => $category->aksara ? ['id' => $category->aksara->id, 'name' => $category->aksara->name] : null,
                'name' => $category->name,
                'description' => $category->description,
                'sort_order' => $category->sort_order,
                'characters' => $category->characters->map(fn ($c): array => [
                    'id' => $c->id,
                    'character' => $c->character,
                    'latin' => $c->latin,
                    'description' => $c->description,
                    'image' => $c->image,
                ])->values(),
            ],
        ]);
    }

    private function summary(Aksara $aksara): array
    {
        return [
            'id' => $aksara->id,
            'name' => $aksara->name,
            'description' => $aksara->description,
            'main_image' => $aksara->main_image,
            'daerah' => $aksara->daerah ? [
                'id' => $aksara->daerah->id,
                'nama' => $aksara->daerah->nama,
                'provinsi' => $aksara->daerah->provinsi,
            ] : null,
        ];
    }

    private function full(Aksara $aksara): array
    {
        return [
            ...$this->summary($aksara),
            'description' => $aksara->description,
            'history' => $aksara->history,
            'categories' => $aksara->categories->map(fn ($cat): array => [
                'id' => $cat->id,
                'name' => $cat->name,
                'description' => $cat->description,
                'sort_order' => $cat->sort_order,
                'characters' => $cat->characters->map(fn ($c): array => [
                    'id' => $c->id,
                    'character' => $c->character,
                    'latin' => $c->latin,
                    'description' => $c->description,
                    'image' => $c->image,
                ])->values(),
            ])->values(),
        ];
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
