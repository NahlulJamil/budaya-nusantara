<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Aksara;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    public function questions(Request $request, int $id): JsonResponse
    {
        $aksara = Aksara::find($id);

        if (! $aksara) {
            return response()->json(['message' => 'Aksara tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = QuizQuestion::query()
            ->where('aksara_id', $aksara->id)
            ->orderBy('id')
            ->paginate($validated['per_page'] ?? 10);

        return response()->json([
            'message' => 'Daftar soal kuis.',
            'data' => [
                'aksara' => ['id' => $aksara->id, 'name' => $aksara->name],
                'soal' => $paginator->map(fn (QuizQuestion $q): array => [
                    'id' => $q->id,
                    'question' => $q->question,
                    'displayed_character' => $q->displayed_character,
                ])->values(),
            ],
            'meta' => $this->meta($paginator),
        ]);
    }

    public function answer(Request $request, int $questionId): JsonResponse
    {
        $validated = $request->validate([
            'user_answer' => ['required', 'string', 'max:255'],
        ]);

        $question = QuizQuestion::find($questionId);

        if (! $question) {
            return response()->json(['message' => 'Soal kuis tidak ditemukan.'], 404);
        }

        // Penilaian mutlak di backend; nilai is_correct dari client diabaikan.
        $isCorrect = mb_strtolower(trim($validated['user_answer']))
            === mb_strtolower(trim($question->correct_answer));

        $attempt = QuizAttempt::create([
            'user_id' => $request->user()->id,
            'question_id' => $question->id,
            'user_answer' => $validated['user_answer'],
            'is_correct' => $isCorrect,
            'answered_at' => now(),
        ]);

        return response()->json([
            'message' => $isCorrect ? 'Jawaban benar.' : 'Jawaban kurang tepat.',
            'data' => [
                'attempt' => [
                    'id' => $attempt->id,
                    'user_answer' => $attempt->user_answer,
                    'is_correct' => $attempt->is_correct,
                    'answered_at' => $attempt->answered_at,
                ],
                'correct_answer' => $question->correct_answer,
                'explanation' => $question->explanation,
            ],
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = QuizAttempt::query()
            ->where('user_id', $request->user()->id)
            ->with(['question'])
            ->orderByDesc('answered_at')
            ->paginate($validated['per_page'] ?? 10);

        return response()->json([
            'message' => 'Riwayat kuis.',
            'data' => $paginator->map(fn (QuizAttempt $a): array => [
                'id' => $a->id,
                'user_answer' => $a->user_answer,
                'is_correct' => $a->is_correct,
                'answered_at' => $a->answered_at,
                'question' => $a->question ? [
                    'id' => $a->question->id,
                    'question' => $a->question->question,
                    'displayed_character' => $a->question->displayed_character,
                    'correct_answer' => $a->question->correct_answer,
                    'explanation' => $a->question->explanation,
                ] : null,
            ])->values(),
            'meta' => $this->meta($paginator),
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
