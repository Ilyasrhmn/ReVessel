import Link from "next/link";
import type { ReactNode } from "react";
import BrandLogo from "./brand-logo";
import styles from "../pages.module.css";

const links = [
  { href: "/tentang", label: "Tentang" },
  { href: "/artikel", label: "Artikel" },
  { href: "/galeri", label: "Galeri" },
  { href: "/kontak", label: "Kontak" },
] as const;

export default function SiteFrame({
  title,
  children,
  mainClassName = "",
  titleClassName = "",
}: {
  title: string;
  children: ReactNode;
  mainClassName?: string;
  titleClassName?: string;
}) {
  return (
    <>
      <main id="main" tabIndex={-1} className={`${styles.main} page-shell ${mainClassName}`}>
        <h1 className={`${styles.title} ${titleClassName}`}>{title}</h1>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className={`${styles.footer} page-shell`}>
      <Link href="/" className={styles.brand}>
        <BrandLogo />
      </Link>
      <nav aria-label="Halaman situs">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
