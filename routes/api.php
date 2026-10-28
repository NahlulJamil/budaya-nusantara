<?php

use App\Http\Controllers\Api\AdminAksaraController;
use App\Http\Controllers\Api\AdminBudayaController;
use App\Http\Controllers\Api\AdminDaerahController;
use App\Http\Controllers\Api\AdminGaleriController;
use App\Http\Controllers\Api\AdminMediaController;
use App\Http\Controllers\Api\AdminQuizController;
use App\Http\Controllers\Api\AksaraController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatbotController;
use App\Http\Controllers\Api\CulturalContentController;
use App\Http\Controllers\Api\DaerahController;
use App\Http\Controllers\Api\GaleriController;
use App\Http\Controllers\Api\JenisTradisiController;
use App\Http\Controllers\Api\QuizController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->name('login');

Route::get('/jenis-tradisi', [JenisTradisiController::class, 'index']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});

Route::get('/daerah', [DaerahController::class, 'index']);
Route::get('/daerah/{id}', [DaerahController::class, 'show']);
Route::get('/budaya', [CulturalContentController::class, 'index']);
Route::get('/budaya/{id}', [CulturalContentController::class, 'show']);
Route::get('/kategori/{kategori}', [CulturalContentController::class, 'byCategory']);

Route::get('/aksara', [AksaraController::class, 'index']);
Route::get('/aksara/{id}', [AksaraController::class, 'show']);
Route::get('/aksara/{id}/kategori/{categoryId}', [AksaraController::class, 'categoryDetail']);
Route::get('/aksara/{id}/kuis', [QuizController::class, 'questions']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/kuis/{questionId}/jawab', [QuizController::class, 'answer']);
    Route::get('/kuis/riwayat', [QuizController::class, 'history']);
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/chatbot/message', [ChatbotController::class, 'message']);
    Route::get('/chatbot/sessions', [ChatbotController::class, 'sessions']);
    Route::get('/chatbot/sessions/{id}', [ChatbotController::class, 'sessionDetail']);
});

Route::get('/galeri', [GaleriController::class, 'index']);
Route::get('/galeri/{id}', [GaleriController::class, 'show']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/galeri-saya', [GaleriController::class, 'mine']);
    Route::post('/galeri', [GaleriController::class, 'store']);
    Route::post('/galeri/{id}/laporkan', [GaleriController::class, 'report']);
});

Route::middleware(['auth:sanctum', 'admin'])->group(function (): void {
    Route::post('/admin/media', [AdminMediaController::class, 'store'])
        ->middleware('throttle:30,1');

    Route::get('/admin/galeri/pending', [AdminGaleriController::class, 'pending']);
    Route::patch('/admin/galeri/{id}/status', [AdminGaleriController::class, 'setStatus']);

    Route::get('/admin/budaya', [AdminBudayaController::class, 'index']);
    Route::post('/admin/budaya', [AdminBudayaController::class, 'store']);
    Route::get('/admin/budaya/{id}', [AdminBudayaController::class, 'show']);
    Route::match(['put', 'patch'], '/admin/budaya/{id}', [AdminBudayaController::class, 'update']);
    Route::delete('/admin/budaya/{id}', [AdminBudayaController::class, 'destroy']);

    Route::get('/admin/daerah', [AdminDaerahController::class, 'index']);
    Route::post('/admin/daerah', [AdminDaerahController::class, 'store']);
    Route::get('/admin/daerah/{id}', [AdminDaerahController::class, 'show']);
    Route::match(['put', 'patch'], '/admin/daerah/{id}', [AdminDaerahController::class, 'update']);
    Route::delete('/admin/daerah/{id}', [AdminDaerahController::class, 'destroy']);

    Route::get('/admin/aksara', [AdminAksaraController::class, 'index']);
    Route::post('/admin/aksara', [AdminAksaraController::class, 'store']);
    Route::get('/admin/aksara/{id}', [AdminAksaraController::class, 'show']);
    Route::match(['put', 'patch'], '/admin/aksara/{id}', [AdminAksaraController::class, 'update']);
    Route::delete('/admin/aksara/{id}', [AdminAksaraController::class, 'destroy']);

    Route::get('/admin/aksara/{id}/kategori', [AdminAksaraController::class, 'categoryIndex']);
    Route::post('/admin/aksara/{id}/kategori', [AdminAksaraController::class, 'categoryStore']);
    Route::get('/admin/kategori/{categoryId}', [AdminAksaraController::class, 'categoryShow']);
    Route::match(['put', 'patch'], '/admin/kategori/{categoryId}', [AdminAksaraController::class, 'categoryUpdate']);
    Route::delete('/admin/kategori/{categoryId}', [AdminAksaraController::class, 'categoryDestroy']);

    Route::get('/admin/kategori/{categoryId}/karakter', [AdminAksaraController::class, 'characterIndex']);
    Route::post('/admin/kategori/{categoryId}/karakter', [AdminAksaraController::class, 'characterStore']);
    Route::get('/admin/karakter/{characterId}', [AdminAksaraController::class, 'characterShow']);
    Route::match(['put', 'patch'], '/admin/karakter/{characterId}', [AdminAksaraController::class, 'characterUpdate']);
    Route::delete('/admin/karakter/{characterId}', [AdminAksaraController::class, 'characterDestroy']);

    Route::get('/admin/aksara/{id}/soal', [AdminQuizController::class, 'index']);
    Route::post('/admin/aksara/{id}/soal', [AdminQuizController::class, 'store']);
    Route::get('/admin/soal/{questionId}', [AdminQuizController::class, 'show']);
    Route::match(['put', 'patch'], '/admin/soal/{questionId}', [AdminQuizController::class, 'update']);
    Route::delete('/admin/soal/{questionId}', [AdminQuizController::class, 'destroy']);
});
