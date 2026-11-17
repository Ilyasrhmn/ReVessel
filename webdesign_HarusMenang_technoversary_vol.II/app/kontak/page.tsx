import type { Metadata } from "next";
import SiteFrame from "../ui/site-frame";
import ContactForm from "../ui/contact-form";
import styles from "../ui/contact.module.css";

export const metadata: Metadata = {
  title: "Kontak | ReVessel",
  description: "Hubungi ReVessel untuk pertanyaan dan masukan.",
};

export default function ContactPage() {
  return (
    <SiteFrame title="Kontak" mainClassName={styles.page} titleClassName={styles.title}>
      <ContactForm />
    </SiteFrame>
  );
}
