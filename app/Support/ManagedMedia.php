<?php

namespace App\Support;

use App\Models\AlatMusik;
use App\Models\BajuAdatVariant;
use App\Models\CulturalContent;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ManagedMedia
{
    public const IMAGE_DIRECTORY = 'budaya/uploads/images';

    public const AUDIO_DIRECTORY = 'budaya/uploads/audio';

    /**
     * Kumpulkan semua referensi media milik satu konten.
     *
     * @return list<string>
     */
    public static function pathsFor(CulturalContent $content): array
    {
        $content->loadMissing(['bajuAdat.variants', 'alatMusik']);

        $paths = [$content->main_image, $content->alatMusik?->audio];

        foreach ($content->bajuAdat?->variants ?? [] as $variant) {
            $paths[] = $variant->avatar_image;
        }

        return array_values(array_unique(array_filter(
            $paths,
            fn (mixed $path): bool => is_string($path) && trim($path) !== '',
        )));
    }

    /**
     * Hapus media lama yang tidak lagi dipakai setelah perubahan database.
     *
     * @param  list<string>  $oldPaths
     * @param  list<string>  $newPaths
     */
    public static function deleteObsolete(array $oldPaths, array $newPaths): void
    {
        $newPathsByDiskPath = [];

        foreach ($newPaths as $path) {
            $normalized = self::normalize($path);

            if ($normalized !== null) {
                $newPathsByDiskPath[$normalized] = true;
            }
        }

        $processed = [];

        foreach ($oldPaths as $path) {
            $normalized = self::normalize($path);

            if ($normalized === null || isset($processed[$normalized])) {
                continue;
            }

            $processed[$normalized] = true;

            if (isset($newPathsByDiskPath[$normalized])) {
                continue;
            }

            if (! self::isManaged($normalized) || self::isReferenced($normalized)) {
                continue;
            }

            self::deleteFile($normalized);
        }
    }

    /**
     * Ubah referensi database menjadi path relatif pada disk `public`.
     * URL eksternal dan path dengan traversal mengembalikan `null`.
     */
    public static function normalize(?string $path): ?string
    {
        if ($path === null) {
            return null;
        }

        $value = trim($path);

        if ($value === '') {
            return null;
        }

        if (preg_match('#^(?:https?:)?//#i', $value) === 1) {
            return null;
        }

        $value = ltrim($value, '/');

        if (str_starts_with($value, 'storage/')) {
            $value = substr($value, strlen('storage/'));
        }

        if ($value === '' || str_contains($value, '..') || str_contains($value, '\\')) {
            return null;
        }

        return $value;
    }

    public static function isManaged(?string $path): bool
    {
        $normalized = self::normalize($path);

        if ($normalized === null) {
            return false;
        }

        return str_starts_with($normalized, self::IMAGE_DIRECTORY.'/')
            || str_starts_with($normalized, self::AUDIO_DIRECTORY.'/');
    }

    public static function isReferenced(string $path): bool
    {
        $normalized = self::normalize($path);

        if ($normalized === null) {
            return false;
        }

        $candidates = array_values(array_unique([
            $normalized,
            '/storage/'.$normalized,
            'storage/'.$normalized,
        ]));

        return CulturalContent::query()->whereIn('main_image', $candidates)->exists()
            || BajuAdatVariant::query()->whereIn('avatar_image', $candidates)->exists()
            || AlatMusik::query()->whereIn('audio', $candidates)->exists();
    }

    private static function deleteFile(string $path): void
    {
        try {
            Storage::disk('public')->delete($path);
        } catch (Throwable $exception) {
            Log::warning('Gagal menghapus media budaya.', [
                'path' => $path,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
