import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import GlassLens from "./glass-lens";
import SiteNavigation from "./ui/site-navigation";
import "lenis/dist/lenis.css";
import "./globals.css";
import "./ui/glass-scrollbar.css";
import "./ui/link-reveal.css";

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReVessel",
  description:
    "Panduan menyiapkan botol kaca untuk pakai ulang atau daur ulang.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={instrument.variable} suppressHydrationWarning>
      <body>
        <GlassLens />
        <SiteNavigation>{children}</SiteNavigation>
      </body>
    </html>
  );
}
