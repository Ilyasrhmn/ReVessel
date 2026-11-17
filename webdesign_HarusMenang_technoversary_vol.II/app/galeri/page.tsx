import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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
      <div className={styles.galleryGrid} data-gallery-index="">
        {galleryItems.map((item, index) => (
          <figure id={item.id} key={item.id} aria-labelledby={"caption-" + item.id}>
            <Link href={"/galeri/" + item.id + "/"} className={styles.galleryLink} data-gallery-navigation="" aria-label={"Lihat " + item.title}>
              <div className={styles.galleryPhoto}>
                <Image src={item.image} alt={item.alt} fill priority={index === 0} sizes="(max-width:760px) 90vw, 45vw" data-gallery-photo={item.id} />
              </div>
              <span id={"caption-" + item.id} className={styles.galleryCaption}>{item.title}</span>
            </Link>
          </figure>
        ))}
      </div>
    </SiteFrame>
  );
}
