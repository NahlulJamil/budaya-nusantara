<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class AdminMediaUploadTest extends TestCase
{
    use RefreshDatabase;

    private string $adminToken;

    private string $userToken;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();

        $user = User::factory()->create();

        Auth::forgetGuards();

        $this->adminToken = $admin->createToken('admin')->plainTextToken;
        $this->userToken = $user->createToken('user')->plainTextToken;
    }

    /**
     * @return array<string, string>
     */
    private function authHeaders(?string $token): array
    {
        $headers = ['Accept' => 'application/json'];

        if ($token !== null) {
            $headers['Authorization'] = "Bearer {$token}";
        }

        return $headers;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function upload(array $payload, ?string $token): TestResponse
    {
        return $this->post('/api/admin/media', $payload, $this->authHeaders($token));
    }

    public function test_guest_cannot_upload_media(): void
    {
        $this->upload([
            'purpose' => 'image',
            'file' => UploadedFile::fake()->image('foto.jpg'),
        ], null)->assertUnauthorized();
    }

    public function test_non_admin_user_cannot_upload_media(): void
    {
        $this->upload([
            'purpose' => 'image',
            'file' => UploadedFile::fake()->image('foto.jpg'),
        ], $this->userToken)->assertForbidden();
    }

    public function test_admin_can_upload_image(): void
    {
        $response = $this->upload([
            'purpose' => 'image',
            'file' => UploadedFile::fake()->image('foto-asli.jpg', 800, 600),
        ], $this->adminToken);

        $response->assertCreated()->assertJsonStructure(['message', 'data' => ['path']]);

        $path = $response->json('data.path');

        $this->assertIsString($path);
        $this->assertStringStartsWith('budaya/uploads/images/', $path);
        $this->assertNotSame('foto-asli.jpg', basename($path));
        $this->assertNotSame('foto-asli', pathinfo($path, PATHINFO_FILENAME));
        Storage::disk('public')->assertExists($path);
    }

    public function test_admin_can_upload_webp_and_png_images(): void
    {
        foreach (['foto.png', 'foto.webp'] as $name) {
            $response = $this->upload([
                'purpose' => 'image',
                'file' => UploadedFile::fake()->image($name, 100, 100),
            ], $this->adminToken);

            $response->assertCreated();
            Storage::disk('public')->assertExists($response->json('data.path'));
        }
    }

    public function test_admin_can_upload_audio(): void
    {
        $response = $this->upload([
            'purpose' => 'audio',
            'file' => UploadedFile::fake()->create('musik.mp3', 512, 'audio/mpeg'),
        ], $this->adminToken);

        $response->assertCreated()->assertJsonStructure(['message', 'data' => ['path']]);

        $path = $response->json('data.path');

        $this->assertStringStartsWith('budaya/uploads/audio/', $path);
        $this->assertNotSame('musik.mp3', basename($path));
        Storage::disk('public')->assertExists($path);
    }

    public function test_upload_requires_valid_purpose(): void
    {
        $this->upload([
            'file' => UploadedFile::fake()->image('foto.jpg'),
        ], $this->adminToken)->assertUnprocessable()->assertJsonValidationErrors('purpose');

        $this->upload([
            'purpose' => 'video',
            'file' => UploadedFile::fake()->image('foto.jpg'),
        ], $this->adminToken)->assertUnprocessable()->assertJsonValidationErrors('purpose');
    }

    public function test_image_purpose_rejects_non_image_file(): void
    {
        $this->upload([
            'purpose' => 'image',
            'file' => UploadedFile::fake()->create('dokumen.pdf', 20, 'application/pdf'),
        ], $this->adminToken)->assertUnprocessable()->assertJsonValidationErrors('file');
    }

    public function test_image_purpose_rejects_svg(): void
    {
        $this->upload([
            'purpose' => 'image',
            'file' => UploadedFile::fake()->create('gambar.svg', 10, 'image/svg+xml'),
        ], $this->adminToken)->assertUnprocessable()->assertJsonValidationErrors('file');
    }

    public function test_image_purpose_rejects_php_file(): void
    {
        $this->upload([
            'purpose' => 'image',
            'file' => UploadedFile::fake()->create('shell.php', 10, 'application/x-php'),
        ], $this->adminToken)->assertUnprocessable()->assertJsonValidationErrors('file');
    }

    public function test_image_purpose_rejects_non_image_content_disguised_as_jpg(): void
    {
        $this->upload([
            'purpose' => 'image',
            'file' => UploadedFile::fake()->createWithContent('shell.jpg', '<?php echo "pwned";'),
        ], $this->adminToken)->assertUnprocessable()->assertJsonValidationErrors('file');

        $this->assertSame([], Storage::disk('public')->allFiles('budaya/uploads/images'));
    }

    public function test_image_purpose_rejects_oversized_file(): void
    {
        $this->upload([
            'purpose' => 'image',
            'file' => UploadedFile::fake()->image('besar.jpg', 100, 100)->size(3000),
        ], $this->adminToken)->assertUnprocessable()->assertJsonValidationErrors('file');
    }

    public function test_image_purpose_rejects_oversized_dimensions(): void
    {
        $this->upload([
            'purpose' => 'image',
            'file' => UploadedFile::fake()->image('lebar.jpg', 4097, 100),
        ], $this->adminToken)->assertUnprocessable()->assertJsonValidationErrors('file');

        $this->upload([
            'purpose' => 'image',
            'file' => UploadedFile::fake()->image('tinggi.jpg', 100, 4097),
        ], $this->adminToken)->assertUnprocessable()->assertJsonValidationErrors('file');
    }

    public function test_audio_purpose_rejects_invalid_type(): void
    {
        $this->upload([
            'purpose' => 'audio',
            'file' => UploadedFile::fake()->image('foto.jpg'),
        ], $this->adminToken)->assertUnprocessable()->assertJsonValidationErrors('file');

        $this->upload([
            'purpose' => 'audio',
            'file' => UploadedFile::fake()->create('catatan.txt', 20, 'text/plain'),
        ], $this->adminToken)->assertUnprocessable()->assertJsonValidationErrors('file');
    }

    public function test_audio_purpose_rejects_oversized_file(): void
    {
        $this->upload([
            'purpose' => 'audio',
            'file' => UploadedFile::fake()->create('besar.mp3', 11000, 'audio/mpeg'),
        ], $this->adminToken)->assertUnprocessable()->assertJsonValidationErrors('file');
    }
}
