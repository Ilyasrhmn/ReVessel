import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReVessel",
  description: "Platform penyetoran botol kaca untuk pakai ulang dan daur ulang.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
