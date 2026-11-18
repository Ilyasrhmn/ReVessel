# ReVessel

Bank sampah digital untuk menyalurkan botol dan jar kaca bekas agar bisa dipakai ulang atau didaur ulang.

| Informasi | Keterangan |
| --- | --- |
| Kompetisi | Web Design Competition Techno Versary Vol. II |
| Tema | EcoDigital For Environment |
| Subtema | 1. Bank Sampah Digital<br>2. Pengelolaan Limbah & Upcycling<br>3. Edukasi Lingkungan |
| Tim | Harus Menang |
| Website | [Buka ReVessel](https://revessel-ten.vercel.app/) |
| Repositori | [Ilyasrhmn/ReVessel](https://github.com/Ilyasrhmn/ReVessel) |

## Tim Harus Menang

- Ilyas Nur Rohman
- Melsindy Aulia Febiola
- Nisa Athifah As Sodri

## Deskripsi

### 1. Latar belakang dan analisis permasalahan

Botol kaca bekas, seperti wadah parfum, sirup, minuman, dan kosmetik, sering langsung dibuang meski sebagian masih layak dipakai ulang. ReVessel berangkat dari tiga persoalan dalam pengumpulan kaca rumah tangga:

- **Pengumpulan kaca belum merata.** Kaca berat dan mudah pecah. Titik kumpul juga punya ketentuan penerimaan yang berbeda, sehingga warga perlu tahu ke mana membawa kaca yang sudah dipilah.
- **Alur penyetoran kurang jelas.** Warga perlu membedakan botol utuh dari kaca pecah, menemukan titik kumpul, dan mengetahui status setoran setelah diajukan.
- **Insentif dan informasi setoran terbatas.** Warga perlu mengetahui jenis kaca yang diterima, berat yang tercatat, serta poin yang bisa diperoleh.

### 2. Solusi melalui platform ReVessel

ReVessel adalah platform web yang menghubungkan warga dengan pengelola titik kumpul melalui tiga fitur utama:

- **Panduan pemilahan dan peta titik kumpul.** Warga bisa mengikuti checklist persiapan botol, membaca FAQ, dan melihat lokasi serta kontak titik kumpul di peta interaktif.
- **Pengajuan dan verifikasi setoran.** Warga mengunggah foto, memilih jenis kaca, dan memasukkan perkiraan berat dalam gram. Admin meninjau pengajuan. Warga bisa memantau statusnya dan memilih antar sendiri atau penjemputan setelah disetujui.
- **Poin dan penukaran.** Setoran yang diterima menghasilkan poin berdasarkan berat bersih. Poin bisa ditukar dengan bibit tanaman, stoples rekondisi, atau saldo rupiah yang bisa diajukan untuk pencairan.

### 3. Tujuan

1. Menjelaskan alur botol dalam tiga tahap, yaitu pilah dan siapkan, kumpulkan dan periksa, lalu salurkan dan pakai ulang.
2. Memberi edukasi tentang pakai ulang dan daur ulang melalui artikel, FAQ, dan checklist **Cek botolmu**.
3. Mempermudah warga menemukan titik kumpul dan mengajukan setoran.
4. Memperjelas proses verifikasi dan memberi insentif melalui poin.
5. Mendokumentasikan tahapan pengumpulan dan pengolahan kaca melalui galeri kegiatan.

### 4. Manfaat

- **Bagi warga**, persiapan botol, lokasi setoran, status pengajuan, dan insentif lebih mudah diketahui.
- **Bagi perajin**, botol utuh yang bersih dan terpilah lebih mudah dimanfaatkan kembali sebagai wadah.
- **Bagi pengelola titik kumpul**, jenis kaca, foto, berat, dan hasil verifikasi setoran tercatat dalam satu alur.
- **Bagi lingkungan**, botol yang masih layak berpeluang dipakai ulang, sementara kaca lainnya dapat disalurkan ke pengolah sesuai ketentuan penerimaannya.

Penerimaan daur ulang bergantung pada pengolah. Karena itu, ReVessel menyarankan pengguna menanyakan jenis kaca yang diterima, cara membungkusnya, dan waktu penyerahan ke titik kumpul masing-masing.

## Fitur yang diimplementasikan

| Fitur | Fungsi |
| --- | --- |
| Panduan dan titik kumpul | Menjelaskan cara menyiapkan kaca dan menampilkan lokasi serta kontak pada pin peta. |
| Artikel dan galeri | Menyediakan bacaan tentang pakai ulang dan daur ulang, serta halaman detail foto kegiatan. |
| Pengajuan setoran | Warga memilih lokasi dan jenis kaca, memasukkan perkiraan berat dalam gram, mengunggah foto, dan menerima kode untuk melacak setoran. |
| Pemeriksaan admin | Admin mencari setoran berdasarkan kode, meninjau foto, menyetujui atau menolak pengajuan, lalu mencatat hasil pemeriksaan. |
| Serah terima dan reward | Warga memilih cara serah terima setelah disetujui. Setoran yang diterima menambah poin yang bisa ditukar dengan reward. |
| Kontak | Pengunjung mengisi form, lalu admin dapat membacanya di kotak masuk browser yang sama. |

## Mencoba alur setoran

Buka [halaman Masuk](https://revessel-ten.vercel.app/masuk/), lalu pilih **Lanjut sebagai Warga** atau **Lanjut sebagai Admin**. Kamu juga bisa memakai akun uji publik berikut.

| Peran | Email | Kata sandi |
| --- | --- | --- |
| Warga | `user@revessel.com` | `user123` |
| Admin | `admin@revessel.com` | `admin123` |

1. Sebagai warga, buat setoran, pilih titik kumpul dan jenis kaca, masukkan perkiraan berat dalam gram, lalu unggah foto. Simpan kode setoran yang muncul.
2. Keluar dan masuk sebagai admin. Cari kode setoran, periksa foto, lalu setujui pengajuan.
3. Kembali sebagai warga dan pilih antar sendiri atau penjemputan.
4. Sebagai admin, buka kembali setoran, masukkan berat bersih kaca dalam gram, lalu catat penerimaannya.
5. Sebagai warga, buka **Poin & reward**. Jika saldo cukup, tukar poin dan berikan kode penukaran kepada admin untuk mencatat serah terima reward.

## Nilai kaca dan pencairan

Setoran kaca yang diterima dan ditimbang menghasilkan 1 poin per 100 gram. Warga bisa menukar 1.250 poin dengan Rp50.000, setara 125 kg kaca dengan acuan Rp400/kg. Dana bisa disimpan di saldo atau langsung diajukan pencairan bersama seluruh saldo yang tersedia. Minimum pencairan Rp50.000. Dana yang ditahan kembali ke saldo jika pengajuan ditolak atau dibatalkan. [Sumber tarif](https://trustation.id/index.php)

Poin juga bisa ditukar dengan bibit cabai siap tanam (25 poin) atau stoples kaca rekondisi 250 ml (125 poin).

Warga mengajukan pencairan di **Poin & reward**, lalu admin mencatat pencairan atau menolak pengajuan di **Reward**. Catatan tersimpan di browser. Transfer dana ditangani di luar aplikasi.

Untuk mencoba alurnya, buka halaman **Masuk** dan pilih **Lanjut sebagai Warga**. Pada akun bawaan, tujuh penukaran senilai Rp350.000 dan tiga pencairan senilai Rp200.000 menyisakan saldo Rp150.000. Dengan 1.537 poin tersisa, warga bisa menukar 1.250 poin menjadi Rp50.000 dan menyimpannya atau mengajukan pencairan seluruh Rp200.000. Riwayat penukaran juga mencakup bibit dan stoples.

Pada **Ringkasan**, rentang 30 hari menampilkan 21 setoran dengan berat bersih 297.200 g. Periode pembanding memuat 10 setoran dengan berat bersih 308.000 g. Gunakan filter jenis kaca atau ganti rentang tanggal untuk melihat perbandingan lain.

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

Untuk mencoba kedua peran, gunakan **profil browser dan alamat situs yang sama**. Data di localhost dan situs Vercel tersimpan terpisah.

## Instalasi dan cara menjalankan

### Prasyarat

- Git untuk menyalin repositori.
- Node.js 22 dan npm untuk memasang dependensi dan menjalankan proyek.
- Browser modern dengan penyimpanan situs aktif untuk mencoba alur setoran dan akun.

### 1. Salin repositori

```sh
git clone https://github.com/Ilyasrhmn/ReVessel.git
cd ReVessel/webdesign_HarusMenang_technoversary_vol.II
```

### 2. Pasang dependensi

```sh
npm ci
```

### 3. Jalankan server lokal

```sh
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Gunakan localhost atau HTTPS agar fitur Web Crypto untuk akun baru tersedia.

### 4. Build produksi

```sh
npm run build
```

Next.js mengekspor berkas produksi statis ke folder `out/`.

## Pemeriksaan kode

```sh
npm run lint
npm test
```

`npm test` memeriksa alur akun, setoran, persetujuan, reward, dan persistensi data browser.

## Kredit aset dan komponen

- `glass-study.webp` dibuat sebagai ilustrasi fotografis untuk ReVessel.
- `amber-study.webp` berasal dari [Unsplash](https://images.unsplash.com/photo-1608571423902-eed4a5ad8108) dan digunakan sesuai [Unsplash License](https://unsplash.com/license).
- Peta menggunakan data dari [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
- **Sticky Articles** memakai adaptasi animasi kartu artikel yang bertumpuk saat halaman digulir. [Baca lisensi ISC untuk Sticky Articles](webdesign_HarusMenang_technoversary_vol.II/app/ui/LICENSE-sticky-articles.txt).
- **Glass Icon Reveal** memakai adaptasi animasi yang menampilkan logo ReVessel dengan efek kaca saat situs dibuka. [Baca lisensi MIT untuk Glass Icon Reveal](webdesign_HarusMenang_technoversary_vol.II/app/ui/LICENSE-glass-icon-reveal.txt).
