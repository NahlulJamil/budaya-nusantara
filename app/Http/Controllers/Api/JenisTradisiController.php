<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JenisTradisi;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JenisTradisiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = JenisTradisi::query()
            ->orderBy('nama')
            ->paginate($validated['per_page'] ?? 50);

        return response()->json([
            'message' => 'Daftar jenis tradisi.',
            'data' => $paginator->getCollection()
                ->map(fn (JenisTradisi $jenis): array => [
                    'id' => $jenis->id,
                    'nama' => $jenis->nama,
                ])
                ->values(),
            'meta' => $this->meta($paginator),
        ]);
    }

    /**
     * @return array{current_page: int, per_page: int, total: int, last_page: int}
     */
    private function meta(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'last_page' => $paginator->lastPage(),
        ];
    }
}
