import Link from "next/link";
import type { ReactNode } from "react";
import styles from "../pages.module.css";

const links = [
  { href: "/tentang", label: "Tentang" },
  { href: "/galeri", label: "Galeri" },
  { href: "/artikel", label: "Artikel" },
  { href: "/kontak", label: "Kontak" },
] as const;

export default function SiteFrame({
  title,
  children,
}: {
  title: string;
  active?: string;
  children: ReactNode;
}) {
  return (
    <>
      <main id="main" tabIndex={-1} className={`${styles.main} page-shell`}>
        <h1 className={styles.title}>{title}</h1>
        {children}
      </main>
      <footer className={`${styles.footer} page-shell`}>
        <Link href="/" className={styles.brand}>
          ReVessel
        </Link>
        <nav aria-label="Halaman situs">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </footer>
    </>
  );
}
