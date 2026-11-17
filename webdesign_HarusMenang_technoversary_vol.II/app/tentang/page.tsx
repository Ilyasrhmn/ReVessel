import type { Metadata } from "next";
import Image from "next/image";
import SiteFrame from "../ui/site-frame";
import { BrandPhilosophy } from "../ui/brand-story";
import styles from "../pages.module.css";

export const metadata: Metadata = {
  title: "Tentang | ReVessel",
  description:
    "Panduan ReVessel untuk menyiapkan, mengumpulkan, dan memakai kembali botol kaca.",
};

export default function AboutPage() {
  return (
    <SiteFrame title="Tentang ReVessel">
      <div className={styles.aboutLead}>
        <p>
          ReVessel membantu kamu menyiapkan botol kaca dan menentukan apakah
          botolnya bisa dipakai kembali atau perlu diolah.
        </p>
        <div className={styles.aboutImage}>
          <Image
            src="/images/tentang-bengkel-kaca.webp"
            alt="Suasana bengkel pakai ulang kaca dengan petugas dan perajin di beberapa meja kerja"
            fill
            priority
            sizes="(max-width: 760px) 90vw, 55vw"
          />
        </div>
      </div>
      <section className={styles.roles} aria-labelledby="roles-title">
        <h2 id="roles-title">Peran dalam pengumpulan</h2>
        <dl>
          {[
            ["Penyetor", "Memilah dan menyiapkan botol sesuai panduan."],
            ["Titik kumpul", "Memeriksa kondisi dan mengelompokkan botol."],
            [
              "Perajin & pengolah",
              "Menerima material sesuai kebutuhan dan kemampuannya.",
            ],
          ].map(([role, task]) => (
            <div key={role}>
              <dt>{role}</dt>
              <dd>{task}</dd>
            </div>
          ))}
        </dl>
      </section>
      <BrandPhilosophy />
    </SiteFrame>
  );
}
