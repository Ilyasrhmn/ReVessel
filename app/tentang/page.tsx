import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteFrame from "../ui/site-frame";
import Icon from "../ui/interface-icon";
import { project } from "../content";
import styles from "../pages.module.css";

export const metadata: Metadata = {
  title: "Tentang | ReVessel",
  description:
    "Konsep ReVessel dan peran penyetor, titik kumpul, serta perajin.",
};

export default function AboutPage() {
  return (
    <SiteFrame title="Tentang ReVessel." active="/tentang">
      <div className={styles.aboutLead}>
        <p>
          ReVessel adalah konsep platform yang menghubungkan pemilik botol kaca
          bekas, titik kumpul, dan perajin. Botol yang masih layak diarahkan
          untuk pakai ulang; material lainnya mengikuti syarat penerima daur
          ulang.
        </p>
        <div className={styles.aboutImage}>
          <Image
            src="/images/glass-study.webp"
            alt="Botol dan jar kaca bening"
            fill
            priority
            sizes="(max-width: 760px) 90vw, 55vw"
          />
        </div>
      </div>
      <section className={styles.roles} aria-labelledby="roles-title">
        <h2 id="roles-title">Siapa melakukan apa?</h2>
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
      <div className={styles.projectLine}>
        <span>Tim {project.team}</span>
        <span>Prototipe</span>
        <Link href="/kontak" className={styles.textLink}>
          <Icon kind="contact" />
          Kontak proyek
        </Link>
      </div>
    </SiteFrame>
  );
}
