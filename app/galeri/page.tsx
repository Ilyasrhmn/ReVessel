import type { Metadata } from "next";
import Image from "next/image";
import SiteFrame from "../ui/site-frame";
import styles from "../pages.module.css";

export const metadata: Metadata = {
  title: "Galeri | ReVessel",
  description: "Galeri visual botol dan jar kaca ReVessel.",
};

export default function GalleryPage() {
  return (
    <SiteFrame title="Galeri kaca." active="/galeri">
      <div className={styles.galleryGrid}>
        <figure>
          <div className={styles.galleryPhoto}>
            <Image
              src="/images/glass-study.webp"
              alt="Botol dan jar bening dengan pembiasan cahaya"
              fill
              priority
              sizes="(max-width:760px) 90vw, 55vw"
            />
          </div>
          <figcaption>
            Botol & jar bening <span>Visual konsep</span>
          </figcaption>
        </figure>
        <figure>
          <div className={styles.galleryPhoto}>
            <Image
              src="/images/amber-study.webp"
              alt="Botol kaca amber dengan pipet"
              fill
              sizes="(max-width:760px) 90vw, 35vw"
            />
          </div>
          <figcaption>
            Botol amber <span>Foto referensi</span>
          </figcaption>
        </figure>
      </div>
      <div className={styles.credits}>
        <span>Kredit foto</span>
        <a href="https://images.unsplash.com/photo-1608571423902-eed4a5ad8108">
          Unsplash
        </a>
        <span>Visual botol bening dihasilkan untuk ReVessel.</span>
      </div>
    </SiteFrame>
  );
}
