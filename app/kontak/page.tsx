import type { Metadata } from "next";
import SiteFrame from "../ui/site-frame";
import ContactForm from "./contact-form";
import { project } from "../content";
import styles from "../pages.module.css";

export const metadata: Metadata = {
  title: "Kontak | ReVessel",
  description: "Halaman kontak demonstrasi ReVessel.",
};
export default function ContactPage() {
  return (
    <SiteFrame title="Kontak." active="/kontak">
      <div className={styles.contactGrid}>
        <div className={styles.contactInfo}>
          <span className={styles.demoLabel}>Data contoh</span>
          <p className={styles.email}>{project.demoEmail}</p>
          <p>Tim {project.team}</p>
        </div>
        <ContactForm />
      </div>
    </SiteFrame>
  );
}
