import Link from "next/link";
import { BrandSymbol } from "./brand-logo";
import styles from "./brand.module.css";

const meanings = [
  {
    title: "Garis atas dan bukaan ke bawah",
    text: "Bukaan itu berarti masih ada kesempatan untuk memakai wadah lagi setelah penggunaan pertama selesai.",
  },
  {
    title: "Garis bawah dalam putaran 180°",
    text: "Putaran ini menggambarkan pakai ulang. Wadah yang sama bisa dipakai untuk keperluan lain.",
  },
  {
    title: "Ruang tengah yang tetap terbuka",
    text: "Ruang di tengah melambangkan kegunaan yang masih bisa ditemukan. ReVessel membantu orang menemukan cara memakai wadah kaca lagi.",
  },
];

export function BrandPreview() {
  return (
    <section
      id="makna-logo"
      className={`${styles.preview} page-shell`}
      aria-labelledby="brand-preview-title"
    >
      <div className={styles.tile}>
        <BrandSymbol />
      </div>
      <div className={styles.previewCopy}>
        <h2 id="brand-preview-title">Botol yang sama, guna yang baru</h2>
        <p>
          Dua garis bertukar tempat saat logo diputar. Putaran itu
          menggambarkan gagasan ReVessel tentang pakai ulang.
        </p>
        <Link href="/tentang#filosofi-logo" className={`${styles.link} link-reveal`}>
          <span>Lihat makna logo</span>
        </Link>
      </div>
    </section>
  );
}

export function BrandPhilosophy() {
  return (
    <section
      id="filosofi-logo"
      className={styles.philosophy}
      aria-labelledby="brand-philosophy-title"
      tabIndex={-1}
    >
      <h2 id="brand-philosophy-title">Makna logo ReVessel</h2>
      <svg
        className={styles.diagram}
        viewBox="0 0 500 300"
        aria-hidden="true"
        focusable="false"
      >
        <rect className={styles.diagramTile} x="126" y="26" width="248" height="248" rx="54" />
        <svg x="137" y="37" width="226" height="226" viewBox="0 0 256 256" className={styles.diagramMark}>
          <use href="/brand/bergilir.svg#bergilir" />
        </svg>
        <g className={styles.leadersInside}>
          <path d="M306 98H374 M208 210H126 M250 150H374" />
          <circle cx="306" cy="98" r="3.6" />
          <circle cx="208" cy="210" r="3.6" />
          <circle cx="250" cy="150" r="3.6" />
        </g>
        <g className={styles.leadersOutside}>
          <path d="M374 98H389L412 80 M126 210H106L89 218 M374 150H389L412 173" />
        </g>
        <g className={styles.diagramLabels}>
          <circle cx="427" cy="73" r="17" />
          <circle cx="73" cy="225" r="17" />
          <circle cx="427" cy="180" r="17" />
          <text x="427" y="73">1</text>
          <text x="73" y="225">2</text>
          <text x="427" y="180">3</text>
        </g>
      </svg>
      <ol className={styles.meanings} role="list">
        {meanings.map(({ title, text }, index) => (
          <li key={title}>
            <h3>
              <span className={styles.number} aria-hidden="true">{index + 1}</span>
              {title}
            </h3>
            <p>{text}</p>
          </li>
        ))}
      </ol>
      <section className={styles.turn} aria-labelledby="brand-turn-title">
        <h3 id="brand-turn-title">Dua garis dalam satu putaran</h3>
        <p>
          Selama masih layak, satu wadah bisa dipakai berulang kali
          dan berpindah tangan.
        </p>
      </section>
      <section className={styles.palette} aria-labelledby="brand-palette-title">
        <h3 id="brand-palette-title">Warna dan maknanya</h3>
        <dl>
          <div>
            <dt>
              <span className={`${styles.swatch} ${styles.graphite}`} aria-hidden="true" />
              Hitam grafit
            </dt>
            <dd>
              Melambangkan nilai yang masih dimiliki wadah setelah
              selesai dipakai.
            </dd>
          </div>
          <div>
            <dt>
              <span className={`${styles.swatch} ${styles.softWhite}`} aria-hidden="true" />
              Putih lembut
            </dt>
            <dd>
              Melambangkan bahwa penggunaan baru bisa sama bermanfaatnya
              dengan penggunaan pertama.
            </dd>
          </div>
        </dl>
      </section>
      <p className={styles.nameMeaning}>
        <strong>ReVessel</strong> menyatukan <i lang="en">re</i>, yang berarti
        kembali, dan <i lang="en">vessel</i>, yang berarti wadah.
        Wadah yang layak digunakan kembali.
      </p>
    </section>
  );
}
