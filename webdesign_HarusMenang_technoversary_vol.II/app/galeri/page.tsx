import type { Metadata } from "next";
import Image from "next/image";
import SiteFrame from "../ui/site-frame";
import { galleryItems } from "../gallery-content";
import styles from "../pages.module.css";

export const metadata: Metadata = {
  title: "Galeri | ReVessel",
  description: "Penjemputan, pemilahan, dan proses pakai ulang kaca di ReVessel.",
};

export default function GalleryPage() {
  return (
    <SiteFrame title="Galeri kegiatan">
      <div className={styles.galleryGrid}>
        {galleryItems.map((item, index) => (
          <figure id={item.id} key={item.id}>
            <div className={styles.galleryPhoto}>
              <Image src={item.image} alt={item.alt} fill priority={index === 0} sizes="(max-width:760px) 90vw, 45vw" />
            </div>
            <figcaption>{item.title}</figcaption>
          </figure>
        ))}
      </div>
      <p className={styles.credits}>Ilustrasi kegiatan ReVessel.</p>
    </SiteFrame>
  );
}
