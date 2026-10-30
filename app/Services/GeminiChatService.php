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
        $contents = [];
        foreach ($history as $item) {
            $contents[] = [
                'role' => $item['sender'] === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $item['message']]],
            ];
        }
        $contents[] = ['role' => 'user', 'parts' => [['text' => $userMessage]]];

        return $this->complete($systemInstruction, $contents, 2048, 0.7, 'low');
    }

    public function complete(
        string $systemInstruction,
        array $contents,
        int $maxTokens,
        float $temperature,
        ?string $thinkingLevel = null
    ): string {
        $config = config('services.gemini');
        $key = $config['key'] ?? null;

        if (empty($key)) {
            throw new GeminiNotConfiguredException('Layanan AI belum dikonfigurasi. Administrator perlu mengisi GEMINI_API_KEY.');
        }

        $model = $config['model'] ?? 'gemini-3.5-flash';
        $timeout = (int) ($config['timeout'] ?? 30);

        $generationConfig = [
            'maxOutputTokens' => $maxTokens,
            'temperature' => $temperature,
        ];

        if ($thinkingLevel !== null) {
            $generationConfig['thinkingConfig'] = ['thinkingLevel' => $thinkingLevel];
        }

        try {
            $response = Http::timeout($timeout)
                ->acceptJson()
                ->withQueryParameters(['key' => $key])
                ->post(self::ENDPOINT."/{$model}:generateContent", [
                    'system_instruction' => ['parts' => [['text' => $systemInstruction]]],
                    'contents' => $contents,
                    'generationConfig' => $generationConfig,
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
