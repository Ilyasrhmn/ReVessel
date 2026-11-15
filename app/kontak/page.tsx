import type { Metadata } from "next";
import SiteFrame from "../ui/site-frame";
import Icon from "../ui/interface-icon";
import styles from "../pages.module.css";

export const metadata: Metadata = {
  title: "Kontak | ReVessel",
  description: "Kirim masukan atau laporkan masalah di ReVessel.",
};

export default function ContactPage() {
  return (
    <SiteFrame title="Kontak">
      <div className={styles.contactChannel}>
        <a
          href="https://github.com/Ilyasrhmn/ReVessel/issues/new"
          aria-describedby="contact-visibility"
          className={`${styles.textLink} link-reveal`}
        >
          <Icon kind="external" />
          <span>Tulis masukan di GitHub</span>
        </a>
        <p id="contact-visibility">
          Perlu akun GitHub. Masukan yang kamu kirim bisa dibaca publik.
        </p>
      </div>
    </SiteFrame>
  );
}
