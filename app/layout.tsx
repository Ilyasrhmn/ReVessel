import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReVessel",
  description:
    "Platform penyetoran botol kaca untuk pakai ulang dan daur ulang.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={instrument.variable}>
      <body>{children}</body>
    </html>
  );
}
