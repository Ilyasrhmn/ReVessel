import type { Metadata } from "next";
import SiteFrame from "../ui/site-frame";
import ContactForm from "./contact-form";

export const metadata: Metadata = {
  title: "Kontak | ReVessel",
  description: "Kirim masukan atau laporkan masalah di ReVessel.",
};

export default function ContactPage() {
  return (
    <SiteFrame title="Kontak">
      <ContactForm />
    </SiteFrame>
  );
}
