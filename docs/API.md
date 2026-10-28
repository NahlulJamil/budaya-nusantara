# Dokumentasi API — Budaya Nusantara

Backend Laravel (API JSON) untuk platform budaya Indonesia.
Dokumen ini disusun dari implementasi aktual (`routes/api.php` + controller).

## 1. Arsitektur ringkas

- Pola: REST JSON, prefix `/api`, auth token **Laravel Sanctum** (Bearer).
- Tanpa Form Request / API Resource: validasi inline di controller, mapping respons manual.
- Format respons konsisten: `{ "message": string, "data": ..., "meta"?: {...} }`.
- Error validasi Laravel: `422 { "message": ..., "errors": { field: [...] } }`.

## 2. Base URL & autentikasi

| Lingkungan  | Base URL (ganti sesuai server) |
| ----------- | ------------------------------ |
| Development | `http://localhost:8000/api`    |

Alur: `POST /register` → terima `token` → kirim header
`Authorization: Bearer <token>` untuk endpoint bertanda 🔒.
`POST /logout` menghapus token aktif.

## 3. HTTP status yang dipakai

| Status | Arti |
| ------ | ---- |
| 200 | Berhasil |
| 201 | Berhasil dibuat |
| 401 | Tanpa token / token tidak valid (`{"message":"Unauthenticated."}`) |
| 403 | Login tapi bukan admin (`{"message":"Akses ditolak."}`) |
| 404 | Tidak ditemukan (JSON `{"message": ...}`) |
| 409 | Konflik: laporan duplikat / hapus terhalang relasi |
| 422 | Validasi gagal |
| 502/503 | Chatbot: Gemini gagal / belum dikonfigurasi |

## 4. Pagination, pencarian, filter

List memakai `?per_page=` (default `10`, maks `50`) dan merespons
`meta: { current_page, per_page, total, last_page }`.

## 5. Autentikasi

### POST /register (publik)
Body: `username*` (string ≤255, unik), `email*` (email, unik),
`password*` (min 8) + `password_confirmation`. Role selalu `user`
(input `role`/`created_by` dari client diabaikan).
→ `201 { message, data: { user: {id,username,email,role}, token, token_type: "Bearer" } }`

### POST /login (publik)
Body: `email*`, `password*`. Salah → `422` generik tanpa bocoran.
→ `200` bentuk sama seperti register.

### POST /logout 🔒 / GET /me 🔒
Logout menghapus token aktif. `me` → `{ message, data: { user } }`
(tanpa password).

## 6. Daerah (publik)

- `GET /daerah?q=&per_page=` — `q` mencari `nama`/`provinsi`.
  Item: `{id,nama,provinsi,deskripsi}`.
- `GET /daerah/{id}` — detail + `konten_published[]` (`{id,category,title}`).
  Tak ada → `404 {"message":"Daerah tidak ditemukan."}`.

## 7. Konten budaya (publik, hanya `published`)

- `GET /budaya?q=&daerah_id=&per_page=` — `daerah_id` harus ada di tabel daerah.
- `GET /budaya/{id}` — draft/asing → 404. Detail memuat `daerah`,
  `description/history/meaning`, `sources[]`, dan `detail` sesuai kategori:
  - `tradisi`: `{process,values,implementation_time,jenis_tradisi{id,nama}}`
  - `baju_adat`: `{usage,variants[{id,gender,avatar_image,description}]}`
  - `makanan`: `{ingredients,recipe,serving_method}`
  - `alat_musik`: `{material,how_to_play,function,audio,interactive_asset{id,name,asset_type,asset_path,is_active}|null}`
    (`configuration` aset **tidak** diekspos).
- `GET /kategori/{kategori}` — `kategori ∈ tradisi,baju_adat,makanan,alat_musik`; lain → 404.
  Filter `daerah_id`/`q`/`per_page` sama seperti daftar.
- `GET /jenis-tradisi?per_page=` — opsi `{id,nama}` untuk kategori tradisi.
  Respons `{message,data,meta}` (default `per_page=50`), diurutkan berdasarkan `nama`.

## 8. Aksara & kuis (publik ambil soal, jawab & riwayat 🔒)

- `GET /aksara?daerah_id=&per_page=` — item `{id,name,main_image,daerah{id,nama,provinsi}}`.
- `GET /aksara/{id}` — + `description/history` + `categories[]` (urut `sort_order`)
  masing-masing dengan `characters[{id,character,latin,description,image}]`.
- `GET /aksara/{id}/kategori/{categoryId}` — 404 bila kategori bukan milik aksara.
- `GET /api/aksara/{id}/kuis` — `{aksara{id,name}, soal[{id,question,displayed_character}]}`.
  **Tanpa** `correct_answer`/`explanation`. Aksara tanpa soal → `soal: []`.
- `POST /kuis/{questionId}/jawab` 🔒 — body `user_answer*` (≤255).
  Penilaian di server (case-insensitive). Balasan:
  `{message, data:{attempt{id,user_answer,is_correct,answered_at}, correct_answer, explanation}}`.
  Soal tak ada → 404. `is_correct` kiriman client diabaikan.
- `GET /kuis/riwayat?per_page=` 🔒 — hanya milik sendiri.

## 9. Galeri

- `GET /galeri?content_id=&per_page=` (publik, hanya `approved`).
  Item: `{id,title,caption,location,activity_date,status,author{id,username},content{id,title,category},media[{id,file_path,media_type,url}]}`.
- `GET /galeri/{id}` (publik, hanya `approved`, else 404).
- `GET /galeri-saya` 🔒 — milik sendiri semua status.
- `POST /galeri` 🔒 multipart — `title*`, `content_id*` (harus konten **published**),
  `caption/location/activity_date(date)` opsional, `media[]` opsional (maks 5,
  gambar `jpg,jpeg,png,webp` ≤2MB) disimpan via Storage `public/galeri/`.
  Status dikunci `approved` (input `status` diabaikan): kiriman valid langsung
  tampil di galeri publik, tanpa moderasi admin. → 201.
- `POST /galeri/{id}/laporkan` 🔒 — `reason*` (≤255), `description` opsional.
  Duplikat user+kiriman → `409 {"message":"Anda sudah melaporkan kiriman ini."}`.
  Kiriman tak ada → 404.

Aturan visibilitas: kiriman baru langsung `approved` dan tampil publik; kiriman lama
tetap sesuai statusnya. Moderasi admin (endpoint `/admin/galeri/*`) tetap tersedia
untuk menangani kiriman lama yang `pending`/`rejected` serta laporan.

## 10. Admin (`auth:sanctum` + role `admin`, middleware `admin`)

- Galeri: `GET /admin/galeri/pending` (+`reports_count`),
  `PATCH /admin/galeri/{id}/status` (`status ∈ approved,rejected`).
- Budaya `/admin/budaya`: list semua status (filter `status/daerah_id/q`);
  `POST` (konten + `detail` kategori dalam transaksi; `created_by` = admin login;
  tradisi wajib `detail.jenis_tradisi_id/process/values/implementation_time`;
  varian baju adat maks 10, gender unik); `GET /{id}` (+creator, sources);
  `PUT|PATCH /{id}` (parsial; ganti kategori menukar tabel detail);
  `DELETE /{id}` (cascade detail/sumber/galeri).
- Daerah `/admin/daerah`: CRUD; `DELETE` ditolak `409` bila masih punya konten/aksara
  (migration memakai cascade — diblokir agar konten publik tak hilang).
- Aksara `/admin/aksara`: CRUD (+`categories_count,quiz_questions_count`);
  hapus diblokir `409` bila soalnya ber-riwayat.
- Kategori `/admin/aksara/{id}/kategori` (list+create), `/admin/kategori/{id}` (CRUD).
- Karakter `/admin/kategori/{id}/karakter` (list+create), `/admin/karakter/{id}` (CRUD).
  `image` opsional; Unicode (mis. ꦲ) tersimpan utuh.
- Soal `/admin/aksara/{id}/soal` (list+`attempts_count`, create),
  `/admin/soal/{id}` (CRUD; admin boleh lihat `correct_answer`;
  hapus diblokir `409` bila ber-riwayat).
- Validasi umum: `daerah_id exists`, `name/title` wajib, `generated_by ∈ manual,ai`,
  `interactive_asset_id exists`, ID asing → 404.

Belum tersedia endpoint admin khusus: `jenis_tradisi`, `content_sources`,
`interactive_assets`, `baju_adat_variants` (varian dikelola nested via budaya).

## 11. Chatbot Gemini (🔒 semua)

Butuh `GEMINI_API_KEY` di server (tanpa key → `503` eksplisit, tanpa jawaban karangan).

- `POST /chatbot/message` — body `message*` (≤2000), `session_id` opsional
  (harus milik sendiri, else 404), `current_content_id` opsional (harus published).
  Tanpa `session_id` → sesi baru. Menyimpan pesan user + balasan asisten.
  Konteks = konten published + relasi; di luar topik budaya Indonesia dialihkan;
  gagal → `502` tanpa balasan palsu.
  → `{message, data:{session{id,current_content_id},user_message{id,message},reply{id,message}}}`.
- `GET /chatbot/sessions?per_page=` — milik sendiri
  (`{id,messages_count,updated_at,current_content{id,title,category}}`).
- `GET /chatbot/sessions/{id}` — milik sendiri else 404
  (`{id,current_content{id,title},messages[{id,sender,message,created_at}]}`).

## 12. Upload file (contoh cURL)

```bash
curl -X POST {{base_url}}/galeri \
  -H "Authorization: Bearer <token>" \
  -F "title=Dokumentasi Seren Taun" \
  -F "content_id=1" \
  -F "media[]=@/path/foto.jpg"
```

Catatan deploy: URL media memakai disk `public`, jalankan `php artisan storage:link`
agar berkas dapat diakses publik.

## 13. Kontrak frontend (ringkas)

| Halaman | Endpoint | Login | Admin | Field penting |
|---|---|---|---|---|
| Register/Login/Profil | `POST /register`, `POST /login`, `GET /me`, `POST /logout` | kecuali register/login | – | `data.token`, `data.user{username,role}` |
| Daftar/Detail daerah | `GET /daerah`, `GET /daerah/{id}` | – | – | `nama,provinsi,konten_published` |
| Katalog/Detail budaya | `GET /budaya`, `GET /budaya/{id}`, `GET /kategori/{k}` | – | – | `title,daerah,detail` per kategori |
| Materi aksara | `GET /aksara`, `GET /aksara/{id}`, `.../kategori/{c}` | – | – | `categories[].characters[]` |
| Kuis | `GET /aksara/{id}/kuis`, `POST /kuis/{q}/jawab`, `GET /kuis/riwayat` | jawab+riwayat | – | `soal[]` tanpa kunci; `is_correct` setelah jawab |
| Galeri publik + saya | `GET /galeri`, `GET /galeri/{id}`, `GET /galeri-saya`, `POST /galeri`, `POST /galeri/{id}/laporkan` | saya/kirim/lapor | – | `status`, `media[].url` |
| Moderasi & CRUD admin | `/admin/*` (galeri, budaya, daerah, aksara, kategori, karakter, soal) | ya | ya | `status`, `reports_count`, `attempts_count` |
| Chatbot | `POST /chatbot/message`, `GET /chatbot/sessions[/{id}]` | ya | – | `session.id` untuk lanjutan chat |

Belum terverifikasi/tersedia: endpoint admin `jenis_tradisi`, `content_sources`,
`interactive_assets`; upload avatar varian baju adat; pembuatan soal oleh AI.
