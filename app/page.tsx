import Landing from "./landing";
import LandingIntro from "./ui/landing-intro";
import { Suspense } from "react";
import Link from "next/link";
import { collectionPoints } from "@/lib/server/deposits";
import { dashboardHref } from "./dashboard/sections";
import styles from "./landing.module.css";

async function PublicCollectionPoints() {
  const points = await collectionPoints().catch(() => null);
  if (!points) return <p>Titik kumpul sedang tidak bisa dimuat. Coba lagi nanti.</p>;
  if (!points.length) return <p>Belum ada titik kumpul aktif.</p>;
  return (
    <>
      {points.map((point) => (
        <article key={point.slug} className={styles.collectionDetails}>
          <h3>{point.name}</h3>
          <p>{point.address}</p>
          <p>Menerima {point.materials.map((material) => material.toLowerCase()).join(", ")}.</p>
        </article>
      ))}
      <Link href={dashboardHref("titik-kumpul")} className={`${styles.sectionLink} link-reveal`}>Lanjut ke dashboard</Link>
    </>
  );
}

const startIntro = `try {
  if (!location.hash && !sessionStorage.getItem("revessel-intro") &&
    !matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active), (prefers-reduced-transparency: reduce)").matches) {
    document.documentElement.setAttribute("data-revessel-intro", "");
  }
} catch {}`;

export default function Home() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: startIntro }} />
      <LandingIntro />
      <Landing points={<Suspense fallback={<p role="status">Memuat titik kumpul…</p>}><PublicCollectionPoints /></Suspense>} />
    </>
  );
}
