import Landing from "./landing";
import LandingIntro from "./ui/landing-intro";
import Link from "next/link";
import { collectionPoints } from "@/lib/browser/data";
import { dashboardHref } from "./dashboard/sections";
import styles from "./landing.module.css";

function PublicCollectionPoints() {
  return (
    <>
      {collectionPoints.map((point) => (
        <article key={point.slug} className={styles.collectionDetails}>
          <h3>{point.name}</h3>
          <p>{point.address}</p>
          <p>Menerima {point.materials.map((material) => material.toLowerCase()).join(", ")}.</p>
        </article>
      ))}
      <Link href={dashboardHref("titik-kumpul")} className={`${styles.sectionLink} link-reveal`}><span>Lanjut ke dashboard</span></Link>
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
      <Landing points={<PublicCollectionPoints />} />
    </>
  );
}
