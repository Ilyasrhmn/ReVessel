# ReVessel

Bank sampah digital untuk menyalurkan botol dan jar kaca bekas agar bisa dipakai ulang atau didaur ulang.

| Informasi | Keterangan |
| --- | --- |
| Kompetisi | Web Design Competition Techno Versary Vol. II |
| Tema | EcoDigital For Environment |
| Subtema | Bank Sampah Digital |
| Tim | Harus Menang |
| Website | [Buka ReVessel](https://revessel-ten.vercel.app/) |
| Repositori | [Ilyasrhmn/ReVessel](https://github.com/Ilyasrhmn/ReVessel) |

## Tim Harus Menang

- Ilyas Nur Rohman
- Melsindy Aulia Febiola
- Nisa Atthifah As Sodri

## Masalah, solusi, dan pengguna

Warga yang ingin menyetor botol kaca perlu tahu cara menyiapkan wadah, lokasi tujuan, dan kapan setoran bisa diserahkan. Saat botol utuh tercampur dengan kaca retak atau pecah, peluang pakai ulang berkurang. Di sisi lain, pengelola titik kumpul memerlukan informasi tentang jenis, jumlah, dan kondisi wadah sebelum menerimanya.

Kami membuat ReVessel untuk menghubungkan panduan pemilahan, titik kumpul, dan pengajuan setoran dalam satu alur. Warga mengirim foto, jenis kaca, dan jumlah wadah. Admin meninjau foto dan memutuskan apakah pengajuan bisa dilanjutkan. Setelah disetujui, warga memilih antar sendiri atau penjemputan. Poin diberikan setelah admin memeriksa dan mencatat penerimaan setoran.

## Fitur yang diimplementasikan

| Fitur | Fungsi |
| --- | --- |
| Panduan dan titik kumpul | Menjelaskan cara menyiapkan kaca dan menampilkan lokasi serta kontak pada pin peta. |
| Artikel dan galeri | Menyediakan bacaan tentang pakai ulang dan daur ulang, serta halaman detail foto kegiatan. |
| Pengajuan setoran | Warga memilih lokasi dan jenis kaca, memasukkan jumlah wadah, mengunggah foto, dan menerima kode untuk melacak setoran. |
| Pemeriksaan admin | Admin mencari setoran berdasarkan kode, meninjau foto, menyetujui atau menolak pengajuan, lalu mencatat hasil pemeriksaan. |
| Serah terima dan reward | Warga memilih cara serah terima setelah disetujui. Setoran yang diterima menambah poin yang bisa ditukar dengan reward. |
| Kontak | Pengunjung mengisi form, lalu admin dapat membacanya di kotak masuk browser yang sama. |

## Mencoba alur setoran

Buka [halaman Masuk](https://revessel-ten.vercel.app/masuk/), lalu pilih **Lanjut sebagai Warga** atau **Lanjut sebagai Admin**. Kamu juga bisa memakai akun uji publik berikut.

| Peran | Email | Kata sandi |
| --- | --- | --- |
| Warga | `user@revessel.com` | `user123` |
| Admin | `admin@revessel.com` | `admin123` |

1. Sebagai warga, buat setoran, pilih titik kumpul dan jenis kaca, masukkan jumlah wadah, lalu unggah foto. Simpan kode setoran yang muncul.
2. Keluar dan masuk sebagai admin. Cari kode setoran, periksa foto, lalu setujui pengajuan.
3. Kembali sebagai warga dan pilih antar sendiri atau penjemputan.
4. Sebagai admin, buka kembali setoran dan catat penerimaannya setelah pemeriksaan.
5. Sebagai warga, buka **Poin & reward**. Jika saldo cukup, tukar poin dan berikan kode penukaran kepada admin untuk mencatat serah terima reward.

## Stack teknologi

| Lapisan | Teknologi | Peran di ReVessel |
| --- | --- | --- |
| Halaman dan navigasi | Next.js App Router | Mengatur rute halaman publik dan dashboard, lalu mengekspor situs sebagai berkas statis di `out/`. |
| Logika dan antarmuka | React dan TypeScript | Menangani form, dialog, serta perubahan status setoran. TypeScript mendefinisikan data akun, setoran, peran, dan reward. |
| Tampilan | Tailwind CSS, CSS Modules, Radix UI, dan Lucide React | Tailwind dan CSS Modules mengatur tata letak serta gaya komponen. Radix UI dipakai untuk komponen seperti tooltip dan indikator progres, sementara Lucide menyediakan ikon. |
| Gerak dan liquid glass | GSAP, Lenis, WebGL, dan View Transitions API | GSAP mengatur adegan yang bergerak saat scroll, Lenis memperhalus scroll, WebGL merender pembiasan kaca, dan View Transitions API menghubungkan foto daftar dengan halaman detail. |
| Peta dan grafik | Leaflet, OpenStreetMap, dan Recharts | Leaflet menampilkan peta serta pin titik kumpul dengan ubin OpenStreetMap. Recharts merender grafik aktivitas setoran di dashboard. |
| Penyimpanan dan akun | `localStorage`, Canvas API, dan Web Crypto API | `localStorage` menyimpan data dan sesi. Canvas memperkecil foto setoran sebelum disimpan. Web Crypto memakai PBKDF2 dengan salt untuk membuat verifier kata sandi akun baru. |
| Pemeriksaan dan hosting | Node.js test runner, ESLint, dan Vercel | Tes otomatis memeriksa alur akun, setoran, dan reward. ESLint memeriksa kode, dan Vercel menyajikan hasil build statis. |

## Alur data dan penyimpanan

1. Saat warga mengajukan setoran, aplikasi memvalidasi input, memperkecil foto di browser, lalu menyimpan setoran dengan kode unik.
2. Dashboard admin membaca data yang sama untuk meninjau pengajuan dan mencatat penerimaan. Dashboard warga menghitung saldo dari setoran yang diterima dan riwayat penukaran.
3. Akun, sesi, setoran dan foto, katalog reward, riwayat penukaran, pengaturan dashboard, serta pesan kontak tetap tersedia saat halaman dimuat ulang selama data situs masih tersimpan.

Untuk mencoba kedua peran, gunakan **profil browser dan alamat situs yang sama**. Data di localhost dan situs Vercel tersimpan terpisah. Instalasi lokal hanya memerlukan Node.js dan npm.

## Instalasi dan cara menjalankan

Gunakan **Node.js 22** dan npm.

```sh
git clone https://github.com/Ilyasrhmn/ReVessel.git
cd ReVessel/webdesign_HarusMenang_technoversary_vol.II
npm ci
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Gunakan localhost atau HTTPS agar fitur Web Crypto untuk akun baru tersedia.

## Pemeriksaan dan build

Jalankan dari folder aplikasi.

```sh
npm run lint
npm test
npm run build
```

`npm test` memeriksa alur akun, setoran, persetujuan, reward, dan persistensi data browser. Hasil build statis tersedia di folder `out/`.

## Kredit aset dan komponen

- `glass-study.webp` dibuat sebagai ilustrasi fotografis untuk ReVessel.
- `amber-study.webp` berasal dari [Unsplash](https://images.unsplash.com/photo-1608571423902-eed4a5ad8108) dan digunakan sesuai [Unsplash License](https://unsplash.com/license).
- Peta menggunakan data dari [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
- **Sticky Articles** memakai adaptasi animasi kartu artikel yang bertumpuk saat halaman digulir. [Baca lisensi ISC untuk Sticky Articles](webdesign_HarusMenang_technoversary_vol.II/app/ui/LICENSE-sticky-articles.txt).
- **Glass Icon Reveal** memakai adaptasi animasi yang menampilkan logo ReVessel dengan efek kaca saat situs dibuka. [Baca lisensi MIT untuk Glass Icon Reveal](webdesign_HarusMenang_technoversary_vol.II/app/ui/LICENSE-glass-icon-reveal.txt).
