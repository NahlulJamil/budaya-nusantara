<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GaleriPost;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminGaleriController extends Controller
{
    public function pending(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = GaleriPost::query()
            ->where('status', 'pending')
            ->with(['user', 'culturalContent', 'media'])
            ->withCount(['reports'])
            ->orderBy('created_at')
            ->paginate($validated['per_page'] ?? 10);

        return response()->json([
            'message' => 'Daftar kiriman menunggu moderasi.',
            'data' => $paginator->map(fn (GaleriPost $p): array => [
                'id' => $p->id,
                'title' => $p->title,
                'caption' => $p->caption,
                'location' => $p->location,
                'activity_date' => $p->activity_date,
                'status' => $p->status,
                'reports_count' => $p->reports_count,
                'author' => $p->user ? [
                    'id' => $p->user->id,
                    'username' => $p->user->username,
                ] : null,
                'content' => $p->culturalContent ? [
                    'id' => $p->culturalContent->id,
                    'title' => $p->culturalContent->title,
                ] : null,
                'media' => $p->media->map(fn ($m): array => [
                    'id' => $m->id,
                    'file_path' => $m->file_path,
                    'media_type' => $m->media_type,
                ])->values(),
            ])->values(),
            'meta' => $this->meta($paginator),
        ]);
    }

    public function setStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:approved,rejected'],
        ]);

        $post = GaleriPost::find($id);

        if (! $post) {
            return response()->json(['message' => 'Kiriman galeri tidak ditemukan.'], 404);
        }

        $post->status = $validated['status'];
        $post->save();

        return response()->json([
            'message' => "Kiriman {$validated['status']}.",
            'data' => ['id' => $post->id, 'status' => $post->status],
        ]);
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
