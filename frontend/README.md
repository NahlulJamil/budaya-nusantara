# GaleriBudaya — Frontend

Frontend Next.js (App Router, TypeScript, Tailwind CSS v4) untuk platform
budaya Indonesia **GaleriBudaya**. Tahap ini berisi halaman Home yang
terintegrasi dengan API Laravel.

## Menjalankan

```bash
cd frontend
npm install
npm run dev
```

Buka `http://localhost:3000`.

Backend Laravel harus berjalan di `http://127.0.0.1:8000`:

```bash
php artisan serve
```

## Konfigurasi

Base URL API dibaca dari environment variable publik:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

Bila tidak diisi, default-nya `http://127.0.0.1:8000/api`.
Lihat `.env.example`. Frontend **tidak** membaca `.env` milik backend.

## Integrasi API

Home memakai endpoint publik yang sudah tersedia:

| Kebutuhan            | Endpoint                                      |
| -------------------- | --------------------------------------------- |
| Kartu budaya         | `GET /budaya?per_page=12`                     |
| Deskripsi kartu      | `GET /budaya/{id}`                            |
| Pratinjau galeri     | `GET /galeri?per_page=6` (hanya `approved`)   |

Hanya konten `published` yang dikembalikan backend pada endpoint publik.
Konten dipilih satu per kategori utama (tradisi, makanan, alat musik)
agar komposisi Home beragam.

Bila API belum berjalan atau belum punya konten `published`, Home
menampilkan **pratinjau kuratif** dari `src/data/homeFallback.ts` dan
memberi catatan kecil di UI. Pratinjau ini tidak pernah menimpa respons
API yang valid.

## Struktur

```
src/
  app/                 route App Router (Home + placeholder navigasi)
  components/home/     section dan card khusus Home
  components/layout/   navbar, footer, halaman placeholder
  components/ui/       komponen UI berulang (gambar, ikon, tombol)
  data/                data pratinjau Home
  hooks/               pemuatan data Home (loading/error/retry)
  lib/                 konfigurasi API, tipe, normalisasi media
```

## Aset gambar

Foto pratinjau berasal dari Wikimedia Commons dan disimpan lokal di
`public/images/`. Lihat `public/images/CREDITS.md` untuk daftar sumber.
Gambar konten dari API memakai URL/path yang dikembalikan backend
(`main_image`, `media[].url`). Untuk media unggahan galeri, jalankan
`php artisan storage:link` di backend agar URL `/storage/...` dapat diakses.

## Pemeriksaan

```bash
npm run lint
npm run build
```
