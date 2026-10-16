<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Daerah;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DaerahController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $query = Daerah::query()->orderBy('nama');

        if (! empty($validated['q'])) {
            $keyword = $validated['q'];
            $query->where(function ($w) use ($keyword): void {
                $w->where('nama', 'like', "%{$keyword}%")
                    ->orWhere('provinsi', 'like', "%{$keyword}%");
            });
        }

        $paginator = $query->paginate($validated['per_page'] ?? 10);

        return response()->json([
            'message' => 'Daftar daerah.',
            'data' => $paginator->map(fn (Daerah $d): array => $this->summary($d))->values(),
            'meta' => $this->meta($paginator),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $daerah = Daerah::find($id);

        if (! $daerah) {
            return response()->json(['message' => 'Daerah tidak ditemukan.'], 404);
        }

        $daerah->load(['culturalContents' => function ($query): void {
            $query->where('status', 'published')->orderBy('title');
        }]);

        return response()->json([
            'message' => 'Detail daerah.',
            'data' => [
                ...$this->summary($daerah),
                'konten_published' => $daerah->culturalContents->map(fn ($c): array => [
                    'id' => $c->id,
                    'category' => $c->category,
                    'title' => $c->title,
                ])->values(),
            ],
        ]);
    }

    private function summary(Daerah $daerah): array
    {
        return [
            'id' => $daerah->id,
            'nama' => $daerah->nama,
            'provinsi' => $daerah->provinsi,
            'deskripsi' => $daerah->deskripsi,
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
