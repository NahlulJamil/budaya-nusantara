<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GaleriMedia;
use App\Models\GaleriPost;
use App\Models\GaleriReport;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class GaleriController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'content_id' => ['nullable', 'integer', 'exists:cultural_contents,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $query = GaleriPost::query()
            ->where('status', 'approved')
            ->with(['user', 'culturalContent', 'media'])
            ->orderByDesc('created_at');

        if (! empty($validated['content_id'])) {
            $query->where('content_id', $validated['content_id']);
        }

        $paginator = $query->paginate($validated['per_page'] ?? 10);

        return response()->json([
            'message' => 'Daftar galeri.',
            'data' => $paginator->map(fn (GaleriPost $p): array => $this->summary($p))->values(),
            'meta' => $this->meta($paginator),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $post = GaleriPost::where('status', 'approved')->find($id);

        if (! $post) {
            return response()->json(['message' => 'Kiriman galeri tidak ditemukan.'], 404);
        }

        $post->load(['user', 'culturalContent', 'media']);

        return response()->json([
            'message' => 'Detail galeri.',
            'data' => $this->summary($post),
        ]);
    }

    public function mine(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = GaleriPost::query()
            ->where('user_id', $request->user()->id)
            ->with(['culturalContent', 'media'])
            ->orderByDesc('created_at')
            ->paginate($validated['per_page'] ?? 10);

        return response()->json([
            'message' => 'Daftar kiriman saya.',
            'data' => $paginator->map(fn (GaleriPost $p): array => $this->summary($p))->values(),
            'meta' => $this->meta($paginator),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content_id' => [
                'required', 'integer',
                Rule::exists('cultural_contents', 'id')->where('status', 'published'),
            ],
            'caption' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'activity_date' => ['nullable', 'date'],
            'media' => ['nullable', 'array', 'max:5'],
            'media.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        // Status dikunci di sisi server; input status dari client selalu diabaikan.
        $post = GaleriPost::create([
            'user_id' => $request->user()->id,
            'content_id' => $validated['content_id'],
            'title' => $validated['title'],
            'caption' => $validated['caption'] ?? null,
            'location' => $validated['location'] ?? null,
            'activity_date' => $validated['activity_date'] ?? null,
            'status' => 'pending',
        ]);

        foreach ($request->file('media', []) as $file) {
            $path = $file->store('galeri', 'public');
            GaleriMedia::create([
                'gallery_post_id' => $post->id,
                'file_path' => $path,
                'media_type' => 'image',
            ]);
        }

        $post->load(['user', 'culturalContent', 'media']);

        return response()->json([
            'message' => 'Kiriman dibuat dan menunggu moderasi.',
            'data' => $this->summary($post),
        ], 201);
    }

    public function report(Request $request, int $id): JsonResponse
    {
        $post = GaleriPost::find($id);

        if (! $post) {
            return response()->json(['message' => 'Kiriman galeri tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        try {
            $report = GaleriReport::create([
                'gallery_post_id' => $post->id,
                'user_id' => $request->user()->id,
                'reason' => $validated['reason'],
                'description' => $validated['description'] ?? null,
                'status' => 'pending',
            ]);
        } catch (QueryException $e) {
            if ($e->getCode() === '23000') {
                return response()->json(['message' => 'Anda sudah melaporkan kiriman ini.'], 409);
            }

            throw $e;
        }

        return response()->json([
            'message' => 'Laporan terkirim dan menunggu peninjauan.',
            'data' => [
                'id' => $report->id,
                'gallery_post_id' => $report->gallery_post_id,
                'reason' => $report->reason,
                'status' => $report->status,
            ],
        ], 201);
    }

    private function summary(GaleriPost $post): array
    {
        return [
            'id' => $post->id,
            'title' => $post->title,
            'caption' => $post->caption,
            'location' => $post->location,
            'activity_date' => $post->activity_date,
            'status' => $post->status,
            'author' => $post->user ? [
                'id' => $post->user->id,
                'username' => $post->user->username,
            ] : null,
            'content' => $post->culturalContent ? [
                'id' => $post->culturalContent->id,
                'title' => $post->culturalContent->title,
                'category' => $post->culturalContent->category,
            ] : null,
            'media' => $post->media->map(fn (GaleriMedia $m): array => [
                'id' => $m->id,
                'file_path' => $m->file_path,
                'media_type' => $m->media_type,
                'url' => Storage::disk('public')->url($m->file_path),
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
