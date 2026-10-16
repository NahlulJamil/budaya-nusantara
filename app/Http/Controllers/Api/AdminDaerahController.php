<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Daerah;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDaerahController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $query = Daerah::query()->withCount(['culturalContents', 'aksaras'])->orderBy('nama');

        if (! empty($validated['q'])) {
            $keyword = $validated['q'];
            $query->where(function ($w) use ($keyword): void {
                $w->where('nama', 'like', "%{$keyword}%")
                    ->orWhere('provinsi', 'like', "%{$keyword}%");
            });
        }

        $paginator = $query->paginate($validated['per_page'] ?? 10);

        return response()->json([
            'message' => 'Daftar daerah (admin).',
            'data' => $paginator->map(fn (Daerah $d): array => [
                'id' => $d->id,
                'nama' => $d->nama,
                'provinsi' => $d->provinsi,
                'cultural_contents_count' => $d->cultural_contents_count,
                'aksaras_count' => $d->aksaras_count,
            ])->values(),
            'meta' => $this->meta($paginator),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'provinsi' => ['required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
        ]);

        $daerah = Daerah::create($validated);

        return response()->json([
            'message' => 'Daerah dibuat.',
            'data' => ['id' => $daerah->id, 'nama' => $daerah->nama],
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $daerah = Daerah::withCount(['culturalContents', 'aksaras'])->find($id);

        if (! $daerah) {
            return response()->json(['message' => 'Daerah tidak ditemukan.'], 404);
        }

        return response()->json([
            'message' => 'Detail daerah (admin).',
            'data' => [
                'id' => $daerah->id,
                'nama' => $daerah->nama,
                'provinsi' => $daerah->provinsi,
                'deskripsi' => $daerah->deskripsi,
                'cultural_contents_count' => $daerah->cultural_contents_count,
                'aksaras_count' => $daerah->aksaras_count,
            ],
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $daerah = Daerah::find($id);

        if (! $daerah) {
            return response()->json(['message' => 'Daerah tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'nama' => ['sometimes', 'string', 'max:255'],
            'provinsi' => ['sometimes', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
        ]);

        $daerah->fill($validated);
        $daerah->save();

        return response()->json([
            'message' => 'Daerah diperbarui.',
            'data' => ['id' => $daerah->id, 'nama' => $daerah->nama],
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $daerah = Daerah::find($id);

        if (! $daerah) {
            return response()->json(['message' => 'Daerah tidak ditemukan.'], 404);
        }

        // Migration memakai cascade: hapus daerah ikut menghapus konten & aksara.
        // Blokir agar konten publik tidak hilang akibat satu penghapusan.
        if ($daerah->culturalContents()->exists() || $daerah->aksaras()->exists()) {
            return response()->json([
                'message' => 'Daerah tidak dapat dihapus karena masih memiliki konten budaya atau aksara.',
            ], 409);
        }

        $daerah->delete();

        return response()->json(['message' => 'Daerah dihapus.']);
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
