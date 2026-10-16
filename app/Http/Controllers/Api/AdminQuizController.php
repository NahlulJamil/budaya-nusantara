<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Aksara;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminQuizController extends Controller
{
    public function index(Request $request, int $id): JsonResponse
    {
        if (! Aksara::where('id', $id)->exists()) {
            return response()->json(['message' => 'Aksara tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = QuizQuestion::where('aksara_id', $id)
            ->withCount(['attempts'])
            ->orderBy('id')
            ->paginate($validated['per_page'] ?? 10);

        return response()->json([
            'message' => 'Daftar soal kuis (admin).',
            'data' => $paginator->map(fn (QuizQuestion $q): array => [
                'id' => $q->id,
                'question' => $q->question,
                'displayed_character' => $q->displayed_character,
                'generated_by' => $q->generated_by,
                'attempts_count' => $q->attempts_count,
            ])->values(),
            'meta' => $this->meta($paginator),
        ]);
    }

    public function store(Request $request, int $id): JsonResponse
    {
        if (! Aksara::where('id', $id)->exists()) {
            return response()->json(['message' => 'Aksara tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'question' => ['required', 'string'],
            'displayed_character' => ['required', 'string', 'max:255'],
            'correct_answer' => ['required', 'string', 'max:255'],
            'explanation' => ['nullable', 'string'],
            'generated_by' => ['nullable', 'string', 'in:manual,ai'],
        ]);

        $question = QuizQuestion::create([...$validated, 'aksara_id' => $id]);

        return response()->json([
            'message' => 'Soal kuis dibuat.',
            'data' => $this->adminShape($question),
        ], 201);
    }

    public function show(int $questionId): JsonResponse
    {
        $question = QuizQuestion::find($questionId);

        if (! $question) {
            return response()->json(['message' => 'Soal kuis tidak ditemukan.'], 404);
        }

        return response()->json([
            'message' => 'Detail soal kuis (admin).',
            'data' => $this->adminShape($question),
        ]);
    }

    public function update(Request $request, int $questionId): JsonResponse
    {
        $question = QuizQuestion::find($questionId);

        if (! $question) {
            return response()->json(['message' => 'Soal kuis tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'aksara_id' => ['sometimes', 'integer', 'exists:aksara,id'],
            'question' => ['sometimes', 'string'],
            'displayed_character' => ['sometimes', 'string', 'max:255'],
            'correct_answer' => ['sometimes', 'string', 'max:255'],
            'explanation' => ['nullable', 'string'],
            'generated_by' => ['nullable', 'string', 'in:manual,ai'],
        ]);

        $question->fill($validated);
        $question->save();

        return response()->json([
            'message' => 'Soal kuis diperbarui.',
            'data' => $this->adminShape($question->fresh()),
        ]);
    }

    public function destroy(int $questionId): JsonResponse
    {
        $question = QuizQuestion::find($questionId);

        if (! $question) {
            return response()->json(['message' => 'Soal kuis tidak ditemukan.'], 404);
        }

        // quiz_attempts memakai restrict: riwayat peserta tidak boleh hilang.
        if (QuizAttempt::where('question_id', $question->id)->exists()) {
            return response()->json([
                'message' => 'Soal tidak dapat dihapus karena sudah memiliki riwayat pengerjaan.',
            ], 409);
        }

        DB::transaction(function () use ($question): void {
            $question->delete();
        });

        return response()->json(['message' => 'Soal kuis dihapus.']);
    }

    private function adminShape(QuizQuestion $q): array
    {
        return [
            'id' => $q->id,
            'aksara_id' => $q->aksara_id,
            'question' => $q->question,
            'displayed_character' => $q->displayed_character,
            'correct_answer' => $q->correct_answer,
            'explanation' => $q->explanation,
            'generated_by' => $q->generated_by,
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
