export const articles = [
  {
    slug: "pakai-ulang-dan-daur-ulang",
    title: "Pakai ulang atau daur ulang?",
    image: "/images/glass-study.webp",
    alt: "Botol dan jar kaca bening tanpa tutup",
    sections: [
      {
        title: "Pakai ulang mempertahankan wadah",
        text: "Pakai ulang berarti menggunakan kembali benda yang sudah ada. Botol utuh dapat dipertimbangkan untuk fungsi yang sesuai, tanpa terlebih dahulu diolah menjadi bahan baku.",
      },
      {
        title: "Daur ulang mengolah material",
        text: "Daur ulang mencakup pengumpulan, pemilahan, dan pengolahan material menjadi produk baru. Jalur ini berbeda dari penggunaan kembali botol dalam bentuk aslinya.",
      },
      {
        title: "Pilih sesuai kondisi dan tujuan",
        text: "Di dalam konsep ReVessel, botol diperiksa sebelum diarahkan ke perajin atau pengolah. Gunakan wadah sesuai tujuan yang aman; kemasan bekas bahan kimia atau kosmetik tidak otomatis cocok untuk makanan, minuman, atau pemanasan.",
      },
    ],
    sources: [
      {
        label: "US EPA: Recycling Basics and Benefits",
        href: "https://www.epa.gov/recycle/recycling-basics-and-benefits",
      },
      {
        label: "Pemerintah Victoria: Reuse and repair",
        href: "https://www.environment.vic.gov.au/household-waste-recycling/reduce-waste/reuse-repair",
      },
    ],
  },
  {
    slug: "pilah-botol-kaca",
    title: "Sebelum botol masuk titik kumpul",
    image: "/images/amber-study.webp",
    alt: "Botol kaca amber dengan pipet",
    sections: [
      {
        title: "Periksa penerimanya",
        text: "Jenis kaca dan kondisi yang diterima dapat berbeda antarprogram. Konfirmasikan syarat titik kumpul sebelum membawa botol. Panduan umum dari luar Indonesia bukan daftar penerimaan bank sampah setempat.",
      },
      {
        title: "Pisahkan komponennya",
        text: "Dalam checklist ReVessel, botol disiapkan dalam keadaan kosong, bersih, dan kering. Tutup atau pompa dilepas jika memungkinkan; komponen yang menyatu perlu diperiksa oleh penerima. EPA juga menyarankan pemisahan tutup logam dari botol kaca.",
      },
      {
        title: "Pisahkan kaca yang rusak",
        text: "Botol retak atau pecah tidak masuk jalur pakai ulang. Jangan campurkan pecahannya dengan botol utuh atau masukkan ke wadah daur ulang umum. Tanyakan penanganannya kepada pengelola karena pecahan kaca dapat melukai petugas.",
      },
    ],
    sources: [
      {
        label: "US EPA: How Do I Recycle Common Recyclables, bagian Glass",
        href: "https://www.epa.gov/recycle/how-do-i-recycle-common-recyclables#glass",
      },
    ],
  },
] as const;

export const project = {
  team: "Harus Menang",
  demoEmail: "info@revessel.com",
};
