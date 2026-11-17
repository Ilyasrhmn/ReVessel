import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { galleryItems } from "../../gallery-content";
import { SiteFooter } from "../../ui/site-frame";
import styles from "../gallery-detail.module.css";

export function generateStaticParams() {
  return galleryItems.map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = galleryItems.find((item) => item.id === id);
  return { title: item ? item.title + " | ReVessel" : "Galeri | ReVessel" };
}

export default async function GalleryDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = galleryItems.find((entry) => entry.id === id);
  if (!item) notFound();

  return (
    <>
      <main id="main" data-gallery-detail={item.id} tabIndex={-1} className={`${styles.main} page-shell`}>
        <Link className={styles.back} href="/galeri/" data-gallery-navigation=""><ArrowLeft aria-hidden="true" />Kembali ke galeri</Link>
        <div className={styles.layout}>
          <div className={styles.photo}>
            <Image src={item.image} alt={item.alt} fill priority sizes="(max-width:760px) 92vw, 62vw" data-gallery-photo={item.id} />
          </div>
          <div className={styles.copy}>
            <h1>{item.title}</h1>
            <p>{item.description}</p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
