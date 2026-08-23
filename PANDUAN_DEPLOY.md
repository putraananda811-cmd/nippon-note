# NIPPON NOTE — Panduan Deploy Static + Decap CMS

Project ini sudah dikonversi dari full-stack (FastAPI + MongoDB) menjadi
**static site**. Semua konten (artikel, anime, destinasi, artis, kata)
sekarang disimpan sebagai file JSON di `frontend/src/data/`, bukan di database.

Admin panel sekarang pakai **Decap CMS** (login via GitHub), bukan lagi
JWT login custom.

---

## Apa yang berubah

| Sebelumnya | Sekarang |
|---|---|
| Data di MongoDB, fetch via API | Data di file JSON, di-import langsung |
| Login email/password custom | Login via GitHub (Decap CMS) |
| Admin dashboard custom | Decap CMS default UI |
| Hosting Emergent (~$20/bln) | Netlify gratis |
| Update konten = instant | Update konten = commit ke GitHub → Netlify rebuild (1-3 menit) |

Halaman publik (Homepage, Article, Anime, Destination, Artist, Quiz)
**tampilannya 100% sama** — kode React/CSS-nya tidak diubah, cuma sumber
datanya yang beda.

---

## Langkah 1 — Push ke GitHub

1. Buat repository baru di GitHub (public atau private, bebas).
2. Di folder project ini (root, sejajar dengan `netlify.toml`), jalankan:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - NIPPON NOTE static"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO_NAME.git
   git push -u origin main
   ```
3. Ganti `USERNAME/REPO_NAME` sesuai repo lo.

## Langkah 2 — Edit `frontend/public/admin/config.yml`

Buka file itu, baris pertama di bagian `backend:`:
```yaml
backend:
  name: github
  repo: YOUR_GITHUB_USERNAME/YOUR_REPO_NAME   # <-- ganti ini
  branch: main
```
Ganti `YOUR_GITHUB_USERNAME/YOUR_REPO_NAME` dengan repo yang barusan lo buat.
Commit & push lagi perubahan ini.

## Langkah 3 — Deploy ke Netlify

1. Buka [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**.
2. Pilih GitHub, authorize, pilih repo NIPPON NOTE lo.
3. Netlify otomatis baca `netlify.toml` — build command dan publish folder
   sudah ke-setup otomatis, tinggal klik **Deploy**.
4. Tunggu 1-3 menit sampai build selesai → dapat URL live (`namaacak.netlify.app`).
5. (Opsional) Ganti ke custom domain di Site settings → Domain management.

## Langkah 4 — Aktifkan Decap CMS (Netlify Identity / GitHub OAuth)

Decap CMS butuh cara autentikasi. Paling gampang pakai **GitHub OAuth via Netlify**:

1. Di dashboard Netlify site lo → **Site settings → Access & security → OAuth**.
2. Klik **Install provider → GitHub**, ikuti instruksi (butuh bikin OAuth App
   di GitHub Developer Settings, cuma sekali).
3. Setelah itu, admin panel bisa diakses di:
   ```
   https://namasite-lo.netlify.app/admin
   ```
4. Klik **Login with GitHub**, authorize, langsung masuk ke Decap CMS.

## Langkah 5 — Testing

- Buka homepage, pastikan semua 13 section tampil dengan data yang benar.
- Buka `/admin`, coba edit satu artikel, save.
- Cek GitHub repo lo — harusnya ada commit baru otomatis dari Decap CMS.
- Tunggu 1-3 menit, refresh homepage — perubahan harusnya sudah live
  (Netlify auto-rebuild tiap ada commit baru).

---

## Catatan penting

- **Folder `backend/`** sudah tidak dipakai lagi untuk deployment ini —
  disimpan di zip cuma untuk referensi/backup, boleh dihapus kalau mau.
- **Search, Quiz, Interactive Map, Spotify embed** — semua tetap jalan
  normal karena itu logic client-side (JS di browser), tidak butuh backend.
- **Upload gambar** lewat Decap CMS akan tersimpan di
  `frontend/public/uploads/` — makin banyak gambar, makin besar ukuran
  repo GitHub. Untuk skala besar nanti, pertimbangkan pindah ke external
  image host (Cloudinary dll) — belum perlu untuk sekarang.
- Kalau butuh nambah field baru di collection (misal artikel butuh field
  baru), edit `frontend/public/admin/config.yml` bagian `fields`.
