<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class GeminiNotConfiguredException extends \RuntimeException {}

class GeminiUnavailableException extends \RuntimeException {}

class GeminiChatService
{
    private const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

    public function generateReply(string $systemInstruction, array $history, string $userMessage): string
    {
        $config = config('services.gemini');
        $key = $config['key'] ?? null;

        if (empty($key)) {
            throw new GeminiNotConfiguredException('Layanan AI belum dikonfigurasi. Administrator perlu mengisi GEMINI_API_KEY.');
        }

        $model = $config['model'] ?? 'gemini-2.0-flash';
        $timeout = (int) ($config['timeout'] ?? 30);

        $contents = [];
        foreach ($history as $item) {
            $contents[] = [
                'role' => $item['sender'] === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $item['message']]],
            ];
        }
        $contents[] = ['role' => 'user', 'parts' => [['text' => $userMessage]]];

        try {
            $response = Http::timeout($timeout)
                ->acceptJson()
                ->post(self::ENDPOINT."/{$model}:generateContent", [
                    'key' => $key,
                    'system_instruction' => ['parts' => [['text' => $systemInstruction]]],
                    'contents' => $contents,
                    'generationConfig' => ['maxOutputTokens' => 1024, 'temperature' => 0.7],
                ]);
        } catch (ConnectionException $e) {
            throw new GeminiUnavailableException('Layanan AI tidak dapat dihubungi. Coba lagi nanti.');
        }

        if ($response->failed()) {
            throw new GeminiUnavailableException('Layanan AI tidak tersedia saat ini. Coba lagi nanti.');
        }

        $text = $response->json('candidates.0.content.parts.0.text');

        if (! is_string($text) || trim($text) === '') {
            throw new GeminiUnavailableException('Layanan AI tidak memberikan jawaban. Coba lagi nanti.');
        }

        return $text;
    }
}
