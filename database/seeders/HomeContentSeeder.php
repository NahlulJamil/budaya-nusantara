<?php

namespace Database\Seeders;

use App\Models\AlatMusik;
use App\Models\CulturalContent;
use App\Models\Daerah;
use App\Models\GaleriMedia;
use App\Models\GaleriPost;
use App\Models\JenisTradisi;
use App\Models\Makanan;
use App\Models\Tradisi;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Mengisi konten awal untuk Home (3 kartu utama + galeri publik).
 *
 * Jalankan:
 *   php artisan storage:link
 *   php artisan db:seed --class=HomeContentSeeder
 *
 * Seeder idempoten: konten dicocokkan berdasarkan judul, lalu diperbarui.
 * Galeri "Randang Jariang" ditautkan ke konten makanan "Tinutuan" karena
 * Home hanya memilih satu konten makanan; relasi ini bisa diganti dari admin
 * saat pengelolaan galeri sudah tersedia.
 */
class HomeContentSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::query()
            ->where('role', 'admin')
            ->orderBy('id')
            ->first()
            ?? User::query()->orderBy('id')->first();

        if (! $user) {
            throw new RuntimeException(
                'Seeder membutuhkan minimal satu user (disarankan admin) untuk penulis galeri.'
            );
        }

        $this->publishAssets();

        $daerah = [
            'surakarta' => Daerah::updateOrCreate(
                ['nama' => 'Surakarta'],
                [
                    'provinsi' => 'Jawa Tengah',
                    'deskripsi' => 'Kota budaya di Jawa Tengah dengan tradisi keraton yang masih hidup.',
                ],
            ),
            'manado' => Daerah::updateOrCreate(
                ['nama' => 'Manado'],
                [
                    'provinsi' => 'Sulawesi Utara',
                    'deskripsi' => 'Kota pesisir Sulawesi Utara dengan kekayaan kuliner dan bahari.',
                ],
            ),
            'bandung' => Daerah::updateOrCreate(
                ['nama' => 'Bandung'],
                [
                    'provinsi' => 'Jawa Barat',
                    'deskripsi' => 'Kota di Jawa Barat yang lekat dengan seni dan kerajinan tradisional.',
                ],
            ),
            'denpasar' => Daerah::updateOrCreate(
                ['nama' => 'Denpasar'],
                [
                    'provinsi' => 'Bali',
                    'deskripsi' => 'Pusat budaya Bali dengan tradisi seni pertunjukan yang kuat.',
                ],
            ),
            'padang' => Daerah::updateOrCreate(
                ['nama' => 'Padang'],
                [
                    'provinsi' => 'Sumatra Barat',
                    'deskripsi' => 'Kota di Sumatra Barat dengan warisan arsitektur dan kuliner Minangkabau.',
                ],
            ),
        ];

        $jenisTradisi = [
            'upacara' => JenisTradisi::updateOrCreate(
                ['nama' => 'Upacara Adat'],
                ['deskripsi' => 'Tradisi yang dijalankan sebagai bagian dari upacara atau perayaan adat.'],
            ),
            'seni' => JenisTradisi::updateOrCreate(
                ['nama' => 'Seni Pertunjukan'],
                ['deskripsi' => 'Tradisi yang diwujudkan melalui tari, musik, atau pertunjukan.'],
            ),
            'arsitektur' => JenisTradisi::updateOrCreate(
                ['nama' => 'Arsitektur Tradisional'],
                ['deskripsi' => 'Pengetahuan dan praktik membangun ruang hidup secara tradisional.'],
            ),
        ];

        $contents = [
            [
                'title' => 'Sekaten',
                'category' => 'tradisi',
                'daerah_id' => $daerah['surakarta']->id,
                'main_image' => '/storage/budaya/sekaten.jpg',
                'description' => 'Mengenal perayaan Maulid Nabi dan peran gamelan dalam tradisi keraton Surakarta.',
                'history' => 'Sekaten berakar pada tradisi keraton Jawa yang dipakai untuk menyebarkan ajaran Islam melalui gamelan dan pasar rakyat.',
                'meaning' => 'Sekaten mempertemukan nilai spiritual, seni, dan kebersamaan warga dalam satu ruang perayaan.',
                'detail' => [
                    'jenis_tradisi_id' => $jenisTradisi['upacara']->id,
                    'process' => 'Rangkaian diawali dengan menabuh gamelan sekaten, diikuti kira-kira, pasar rakyat, dan pembagian gunungan.',
                    'values' => 'Kesalehan, gotong royong, pelestarian seni gamelan, dan keterbukaan bagi masyarakat luas.',
                    'implementation_time' => 'Setiap bulan Maulid dalam kalender Hijriah.',
                ],
            ],
            [
                'title' => 'Tinutuan',
                'category' => 'makanan',
                'daerah_id' => $daerah['manado']->id,
                'main_image' => '/storage/budaya/tinutuan.jpg',
                'description' => 'Bubur Manado adalah sepinggan kehangatan dari tanah Sulawesi Utara.',
                'history' => 'Tinutuan tumbuh dari kebiasaan masyarakat Manado mengolah beras dan sayuran lokal menjadi hidangan pagi yang mengenyangkan.',
                'meaning' => 'Hidangan ini mencerminkan kesederhanaan, pemanfaatan hasil bumi, dan kehangatan meja makan keluarga.',
                'detail' => [
                    'ingredients' => 'Beras, jagung, labu kuning, bayam, kangkung, daun kemangi, dan bumbu lokal.',
                    'recipe' => 'Beras dimasak bersama jagung hingga lembut, lalu sayuran dan labu ditambahkan sebelum disajikan.',
                    'serving_method' => 'Disajikan hangat dengan sambal, ikan asin, atau telur sebagai pelengkap.',
                ],
            ],
            [
                'title' => 'Angklung',
                'category' => 'alat_musik',
                'daerah_id' => $daerah['bandung']->id,
                'main_image' => '/storage/budaya/angklung.jpg',
                'description' => 'Harmoni bambu yang mengalun dalam irama kebersamaan.',
                'history' => 'Angklung berkembang dalam tradisi masyarakat Sunda dan kini dikenal sebagai alat musik bambu yang dimainkan secara berkelompok.',
                'meaning' => 'Setiap angklung berbunyi satu nada; harmoni lahir ketika banyak orang memainkannya bersama.',
                'detail' => [
                    'material' => 'Bambu pilihan yang dipotong dan disusun dalam bingkai.',
                    'how_to_play' => 'Digoyangkan dengan gerakan tangan agar tabung bambu saling beradu dan menghasilkan nada.',
                    'function' => 'Mengiringi pertunjukan seni, upacara adat, dan kegiatan edukasi budaya.',
                    'audio' => null,
                ],
            ],
            [
                'title' => 'Tari Legong',
                'category' => 'tradisi',
                'daerah_id' => $daerah['denpasar']->id,
                'main_image' => '/storage/budaya/tari-legong.jpg',
                'description' => 'Tari Bali yang memadukan gerak lentik, ekspresi, dan iringan gamelan.',
                'history' => 'Legong tumbuh di lingkungan kerajaan Bali dan diwariskan dari generasi ke generasi sebagai seni pertunjukan sakral dan hiburan.',
                'meaning' => 'Tari Legong merepresentasikan keanggunan, disiplin, dan hubungan erat antara manusia, seni, dan kehidupan spiritual.',
                'detail' => [
                    'jenis_tradisi_id' => $jenisTradisi['seni']->id,
                    'process' => 'Penari berlatih gerak tangan, mata, dan kaki, lalu tampil diiringi gamelan dalam sebuah pertunjukan.',
                    'values' => 'Keanggunan, ketekunan, penghormatan kepada tradisi, dan kerja sama dengan para penabuh gamelan.',
                    'implementation_time' => 'Pada upacara adat, festival budaya, dan pertunjukan seni.',
                ],
            ],
            [
                'title' => 'Tradisi Rumah Gadang',
                'category' => 'tradisi',
                'daerah_id' => $daerah['padang']->id,
                'main_image' => '/storage/budaya/rumah-gadang.jpg',
                'description' => 'Rumah gadang bukan sekadar bangunan, tetapi ruang hidup dan ingatan keluarga Minangkabau.',
                'history' => 'Rumah gadang dibangun secara turun-temurun dan menjadi pusat kehidupan keluarga matrilineal Minangkabau.',
                'meaning' => 'Bentuk atap, ukiran, dan tata ruangnya menyimpan nilai kekeluargaan, musyawarah, dan hubungan dengan alam.',
                'detail' => [
                    'jenis_tradisi_id' => $jenisTradisi['arsitektur']->id,
                    'process' => 'Pembangunan dilakukan secara gotong royong dengan pengetahuan tukang dan pertimbangan adat keluarga.',
                    'values' => 'Kekeluargaan, musyawarah, penghormatan kepada perempuan, dan keharmonisan dengan lingkungan.',
                    'implementation_time' => 'Diwariskan dalam kehidupan sehari-hari dan upacara adat keluarga.',
                ],
            ],
        ];

        $contentByTitle = [];

        foreach ($contents as $data) {
            $content = CulturalContent::updateOrCreate(
                ['title' => $data['title']],
                [
                    'daerah_id' => $data['daerah_id'],
                    'category' => $data['category'],
                    'description' => $data['description'],
                    'history' => $data['history'],
                    'meaning' => $data['meaning'],
                    'main_image' => $data['main_image'],
                    'status' => 'published',
                    'created_by' => $user->id,
                ],
            );

            match ($data['category']) {
                'tradisi' => Tradisi::updateOrCreate(
                    ['content_id' => $content->id],
                    $data['detail'],
                ),
                'makanan' => Makanan::updateOrCreate(
                    ['content_id' => $content->id],
                    $data['detail'],
                ),
                'alat_musik' => AlatMusik::updateOrCreate(
                    ['content_id' => $content->id],
                    $data['detail'],
                ),
                default => null,
            };

            $contentByTitle[$data['title']] = $content;
        }

        // Dibuat berurutan dari yang paling lama agar API (order by created_at desc)
        // menampilkan: Penari Bali, Rumah Gadang, Randang Jariang.
        $gallery = [
            [
                'title' => 'Randang Jariang',
                'content' => 'Tinutuan',
                'file_path' => 'galeri/kuliner.jpg',
                'caption' => 'Randang Jariang, olahan khas Minangkabau.',
                'location' => 'Sumatra Barat',
                'activity_date' => '2026-06-14',
                'created_at' => '2026-06-14 10:00:00',
            ],
            [
                'title' => 'Rumah Gadang',
                'content' => 'Tradisi Rumah Gadang',
                'file_path' => 'galeri/rumah-gadang.jpg',
                'caption' => 'Rumah Gadang, arsitektur tradisional Minangkabau.',
                'location' => 'Sumatra Barat',
                'activity_date' => '2026-07-05',
                'created_at' => '2026-07-05 10:00:00',
            ],
            [
                'title' => 'Penari Bali',
                'content' => 'Tari Legong',
                'file_path' => 'galeri/bali.jpg',
                'caption' => 'Penari Bali dalam sebuah pertunjukan budaya.',
                'location' => 'Denpasar, Bali',
                'activity_date' => '2026-08-17',
                'created_at' => '2026-08-17 10:00:00',
            ],
        ];

        foreach ($gallery as $item) {
            $post = GaleriPost::updateOrCreate(
                ['title' => $item['title'], 'user_id' => $user->id],
                [
                    'content_id' => $contentByTitle[$item['content']]->id,
                    'caption' => $item['caption'],
                    'location' => $item['location'],
                    'activity_date' => $item['activity_date'],
                    'status' => 'approved',
                ],
            );

            // Samakan waktu publikasi agar urutan Home stabil (terbaru lebih dulu).
            $post->forceFill(['created_at' => $item['created_at']])->save();

            $post->media()->delete();
            GaleriMedia::create([
                'gallery_post_id' => $post->id,
                'file_path' => $item['file_path'],
                'media_type' => 'image',
            ]);
        }

        if (! File::exists(public_path('storage'))) {
            $this->command?->warn('Folder public/storage belum ada. Jalankan: php artisan storage:link');
        }

        $this->command?->info('HomeContentSeeder selesai: 5 konten published, 3 galeri approved.');
    }

    private function publishAssets(): void
    {
        $assets = [
            'budaya/sekaten.jpg' => 'budaya-sekaten.jpg',
            'budaya/tinutuan.jpg' => 'budaya-tinutuan.jpg',
            'budaya/angklung.jpg' => 'budaya-angklung.jpg',
            'budaya/tari-legong.jpg' => 'galeri-bali.jpg',
            'budaya/rumah-gadang.jpg' => 'galeri-rumah-gadang.jpg',
            'galeri/bali.jpg' => 'galeri-bali.jpg',
            'galeri/rumah-gadang.jpg' => 'galeri-rumah-gadang.jpg',
            'galeri/kuliner.jpg' => 'galeri-kuliner.jpg',
        ];

        $assetDirectory = database_path('seeders/assets/home');

        foreach ($assets as $target => $source) {
            $sourcePath = $assetDirectory.DIRECTORY_SEPARATOR.$source;

            if (! File::exists($sourcePath)) {
                throw new RuntimeException("Aset seeder tidak ditemukan: {$sourcePath}");
            }

            Storage::disk('public')->put($target, File::get($sourcePath));
        }
    }
}
