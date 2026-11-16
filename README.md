# ReVessel

Platform penyetoran botol kaca agar dapat dipakai ulang atau didaur ulang.

## Pengembangan lokal

Gunakan Node.js 22 LTS, npm, dan PostgreSQL. Buat `.env.local` dari `.env.example`, isi koneksi PostgreSQL dan secret autentikasi, lalu jalankan:

```sh
npm ci
npm run db:migrate
npm run dev
```

Buka [localhost:3000](http://localhost:3000).

## Operasional

- Daftarkan akun operator terpisah, lalu jalankan `npm run db:admin -- <email-operator>`.
- Tambahkan titik setoran resmi dengan `npm run db:point -- <slug> "<nama>" "<alamat>" "<jenis kaca>"`.
- Untuk produksi, gunakan PostgreSQL yang dapat diakses server, terapkan migrasi pada database tersebut, dan set `DATABASE_URL`, `BETTER_AUTH_SECRET`, serta `BETTER_AUTH_URL` sesuai domain deployment.

## Pemeriksaan

```sh
npm run lint
npm run build
```

## Aset visual

- `glass-study.webp`: ilustrasi fotografis yang dihasilkan untuk ReVessel.
- `amber-study.webp`: foto dari [Unsplash](https://images.unsplash.com/photo-1608571423902-eed4a5ad8108), digunakan sesuai [Unsplash License](https://unsplash.com/license).
