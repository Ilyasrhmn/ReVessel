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
    <SiteFrame title="Galeri kaca">
      <div className={styles.galleryGrid}>
        <figure id="jar-bening">
          <div className={styles.galleryPhoto}>
            <Image
              src="/images/galeri-kaca-bening.webp"
              alt="Botol dan jar kaca bening di atas baki perak"
              fill
              priority
              sizes="(max-width:760px) 90vw, 55vw"
            />
          </div>
          <figcaption>
            Botol & jar bening
          </figcaption>
        </figure>
        <figure id="botol-amber">
          <div className={styles.galleryPhoto}>
            <Image
              src="/images/amber-study.webp"
              alt="Botol kaca amber dengan pipet"
              fill
              sizes="(max-width:760px) 90vw, 35vw"
            />
          </div>
          <figcaption>
            Botol amber
          </figcaption>
        </figure>
      </div>
      <div className={styles.credits}>
        <span>Visual botol bening: ilustrasi ReVessel.</span>
        <a href="https://images.unsplash.com/photo-1608571423902-eed4a5ad8108">
          Foto botol amber: Unsplash
        </a>
      </div>
    </SiteFrame>
  );
}
