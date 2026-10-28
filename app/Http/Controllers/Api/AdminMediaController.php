<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ManagedMedia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\ValidationException;

class AdminMediaController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'purpose' => ['required', 'string', 'in:image,audio'],
        ]);

        $isImage = $validated['purpose'] === 'image';

        $request->validate([
            'file' => $isImage ? $this->imageRules() : $this->audioRules(),
        ]);

        $directory = $isImage
            ? ManagedMedia::IMAGE_DIRECTORY
            : ManagedMedia::AUDIO_DIRECTORY;

        $path = $request->file('file')->store($directory, 'public');

        if (! is_string($path) || $path === '') {
            throw ValidationException::withMessages([
                'file' => 'Media gagal disimpan. Silakan coba lagi.',
            ]);
        }

        return response()->json([
            'message' => 'Media berhasil diunggah.',
            'data' => ['path' => $path],
        ], 201);
    }

    /**
     * @return array<int, mixed>
     */
    private function imageRules(): array
    {
        return [
            'required',
            'file',
            File::image()
                ->max(2048)
                ->dimensions(Rule::dimensions()->maxWidth(4096)->maxHeight(4096)),
            'mimetypes:image/jpeg,image/png,image/webp',
            'extensions:jpg,jpeg,png,webp',
        ];
    }

    /**
     * @return array<int, mixed>
     */
    private function audioRules(): array
    {
        return [
            'required',
            'file',
            File::types([
                'audio/mpeg',
                'audio/mp3',
                'audio/wav',
                'audio/x-wav',
                'audio/wave',
                'audio/vnd.wave',
                'audio/ogg',
                'audio/mp4',
                'audio/x-m4a',
                'audio/m4a',
            ])->max(10240),
            'extensions:mp3,wav,ogg,m4a',
        ];
    }
}
