<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Aksara;
use App\Models\AksaraCategory;
use App\Models\AksaraCharacter;
use App\Models\QuizAttempt;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminAksaraController extends Controller
{
    // ---------- Materi aksara ----------

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'daerah_id' => ['nullable', 'integer', 'exists:daerah,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $query = Aksara::query()->with(['daerah'])->withCount(['categories', 'quizQuestions'])->orderBy('name');

        if (! empty($validated['daerah_id'])) {
            $query->where('daerah_id', $validated['daerah_id']);
        }

        $paginator = $query->paginate($validated['per_page'] ?? 10);

        return response()->json([
            'message' => 'Daftar aksara (admin).',
            'data' => $paginator->map(fn (Aksara $a): array => [
                'id' => $a->id,
                'name' => $a->name,
                'daerah' => $a->daerah ? ['id' => $a->daerah->id, 'nama' => $a->daerah->nama] : null,
                'categories_count' => $a->categories_count,
                'quiz_questions_count' => $a->quiz_questions_count,
            ])->values(),
            'meta' => $this->meta($paginator),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'daerah_id' => ['required', 'integer', 'exists:daerah,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'history' => ['nullable', 'string'],
            'main_image' => ['nullable', 'string', 'max:255'],
        ]);

        $aksara = Aksara::create($validated);

        return response()->json([
            'message' => 'Materi aksara dibuat.',
            'data' => ['id' => $aksara->id, 'name' => $aksara->name],
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $aksara = Aksara::find($id);

        if (! $aksara) {
            return response()->json(['message' => 'Aksara tidak ditemukan.'], 404);
        }

        $aksara->load(['daerah', 'categories' => function ($q): void {
            $q->orderBy('sort_order');
        }, 'categories.characters']);

        return response()->json([
            'message' => 'Detail aksara (admin).',
            'data' => [
                'id' => $aksara->id,
                'name' => $aksara->name,
                'description' => $aksara->description,
                'history' => $aksara->history,
                'main_image' => $aksara->main_image,
                'daerah' => $aksara->daerah ? ['id' => $aksara->daerah->id, 'nama' => $aksara->daerah->nama] : null,
                'categories' => $aksara->categories->map(fn ($c): array => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'sort_order' => $c->sort_order,
                    'characters' => $c->characters->map(fn ($ch): array => [
                        'id' => $ch->id,
                        'character' => $ch->character,
                        'latin' => $ch->latin,
                    ])->values(),
                ])->values(),
            ],
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $aksara = Aksara::find($id);

        if (! $aksara) {
            return response()->json(['message' => 'Aksara tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'daerah_id' => ['sometimes', 'integer', 'exists:daerah,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'history' => ['nullable', 'string'],
            'main_image' => ['nullable', 'string', 'max:255'],
        ]);

        $aksara->fill($validated);
        $aksara->save();

        return response()->json([
            'message' => 'Materi aksara diperbarui.',
            'data' => ['id' => $aksara->id, 'name' => $aksara->name],
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $aksara = Aksara::find($id);

        if (! $aksara) {
            return response()->json(['message' => 'Aksara tidak ditemukan.'], 404);
        }

        // Soal dihapus cascade, tetapi quiz_attempts memakai restrict:
        // riwayat peserta tidak boleh hilang diam-diam.
        $hasAttempts = QuizAttempt::whereIn('question_id', function ($q) use ($id): void {
            $q->select('id')->from('quiz_questions')->where('aksara_id', $id);
        })->exists();

        if ($hasAttempts) {
            return response()->json([
                'message' => 'Aksara tidak dapat dihapus karena soalnya sudah memiliki riwayat pengerjaan.',
            ], 409);
        }

        DB::transaction(function () use ($aksara): void {
            $aksara->delete();
        });

        return response()->json(['message' => 'Materi aksara dihapus.']);
    }

    // ---------- Kategori ----------

    public function categoryIndex(int $id): JsonResponse
    {
        if (! Aksara::where('id', $id)->exists()) {
            return response()->json(['message' => 'Aksara tidak ditemukan.'], 404);
        }

        $categories = AksaraCategory::where('aksara_id', $id)->withCount(['characters'])->orderBy('sort_order')->get();

        return response()->json([
            'message' => 'Daftar kategori aksara.',
            'data' => $categories->map(fn ($c): array => [
                'id' => $c->id,
                'name' => $c->name,
                'description' => $c->description,
                'sort_order' => $c->sort_order,
                'characters_count' => $c->characters_count,
            ])->values(),
        ]);
    }

    public function categoryStore(Request $request, int $id): JsonResponse
    {
        if (! Aksara::where('id', $id)->exists()) {
            return response()->json(['message' => 'Aksara tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $category = AksaraCategory::create([...$validated, 'aksara_id' => $id]);

        return response()->json([
            'message' => 'Kategori aksara dibuat.',
            'data' => ['id' => $category->id, 'name' => $category->name],
        ], 201);
    }

    public function categoryShow(int $categoryId): JsonResponse
    {
        $category = AksaraCategory::with(['characters'])->find($categoryId);

        if (! $category) {
            return response()->json(['message' => 'Kategori aksara tidak ditemukan.'], 404);
        }

        return response()->json([
            'message' => 'Detail kategori aksara (admin).',
            'data' => [
                'id' => $category->id,
                'aksara_id' => $category->aksara_id,
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

    public function categoryUpdate(Request $request, int $categoryId): JsonResponse
    {
        $category = AksaraCategory::find($categoryId);

        if (! $category) {
            return response()->json(['message' => 'Kategori aksara tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $category->fill($validated);
        $category->save();

        return response()->json([
            'message' => 'Kategori aksara diperbarui.',
            'data' => ['id' => $category->id, 'name' => $category->name],
        ]);
    }

    public function categoryDestroy(int $categoryId): JsonResponse
    {
        $category = AksaraCategory::find($categoryId);

        if (! $category) {
            return response()->json(['message' => 'Kategori aksara tidak ditemukan.'], 404);
        }

        DB::transaction(function () use ($category): void {
            $category->delete();
        });

        return response()->json(['message' => 'Kategori aksara dihapus.']);
    }

    // ---------- Karakter ----------

    public function characterIndex(int $categoryId): JsonResponse
    {
        if (! AksaraCategory::where('id', $categoryId)->exists()) {
            return response()->json(['message' => 'Kategori aksara tidak ditemukan.'], 404);
        }

        $characters = AksaraCharacter::where('category_id', $categoryId)->orderBy('id')->get();

        return response()->json([
            'message' => 'Daftar karakter aksara.',
            'data' => $characters->map(fn ($c): array => $this->characterShape($c))->values(),
        ]);
    }

    public function characterStore(Request $request, int $categoryId): JsonResponse
    {
        if (! AksaraCategory::where('id', $categoryId)->exists()) {
            return response()->json(['message' => 'Kategori aksara tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'character' => ['required', 'string', 'max:255'],
            'latin' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'max:255'],
        ]);

        $character = AksaraCharacter::create([...$validated, 'category_id' => $categoryId]);

        return response()->json([
            'message' => 'Karakter aksara dibuat.',
            'data' => $this->characterShape($character),
        ], 201);
    }

    public function characterShow(int $characterId): JsonResponse
    {
        $character = AksaraCharacter::find($characterId);

        if (! $character) {
            return response()->json(['message' => 'Karakter aksara tidak ditemukan.'], 404);
        }

        return response()->json([
            'message' => 'Detail karakter aksara (admin).',
            'data' => $this->characterShape($character),
        ]);
    }

    public function characterUpdate(Request $request, int $characterId): JsonResponse
    {
        $character = AksaraCharacter::find($characterId);

        if (! $character) {
            return response()->json(['message' => 'Karakter aksara tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'character' => ['sometimes', 'string', 'max:255'],
            'latin' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'max:255'],
        ]);

        $character->fill($validated);
        $character->save();

        return response()->json([
            'message' => 'Karakter aksara diperbarui.',
            'data' => $this->characterShape($character->fresh()),
        ]);
    }

    public function characterDestroy(int $characterId): JsonResponse
    {
        $character = AksaraCharacter::find($characterId);

        if (! $character) {
            return response()->json(['message' => 'Karakter aksara tidak ditemukan.'], 404);
        }

        $character->delete();

        return response()->json(['message' => 'Karakter aksara dihapus.']);
    }

    private function characterShape(AksaraCharacter $c): array
    {
        return [
            'id' => $c->id,
            'category_id' => $c->category_id,
            'character' => $c->character,
            'latin' => $c->latin,
            'description' => $c->description,
            'image' => $c->image,
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
