import Link from "next/link";
import type { ReactNode } from "react";
import Icon from "./interface-icon";
import GlassLens from "../glass-lens";
import glass from "../landing.module.css";
import styles from "../pages.module.css";

const links = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/tentang", label: "Tentang", icon: "about" },
  { href: "/galeri", label: "Galeri", icon: "gallery" },
  { href: "/artikel", label: "Artikel", icon: "article" },
  { href: "/kontak", label: "Kontak", icon: "contact" },
] as const;

export default function SiteFrame({
  title,
  active,
  children,
}: {
  title: string;
  active: string;
  children: ReactNode;
}) {
  return (
    <>
      <GlassLens />
      <a className={styles.skip} href="#page-content">
        Lewati navigasi
      </a>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="ReVessel, Home">
          ReVessel
        </Link>
        <nav
          className={`${styles.navigation} ${glass.liquid}`}
          aria-label="Navigasi utama"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active === link.href ? "page" : undefined}
            >
              <Icon kind={link.icon} />
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main id="page-content" className={`${styles.main} page-shell`}>
        <h1 className={styles.title}>{title}</h1>
        {children}
      </main>
      <footer className={`${styles.footer} page-shell`}>
        <Link href="/" className={styles.brand}>
          ReVessel
        </Link>
        <nav aria-label="Halaman situs">
          {links.slice(1).map((link) => (
            <Link key={link.href} href={link.href}>
              <Icon kind={link.icon} />
              {link.label}
            </Link>
          ))}
        </nav>
      </footer>
    </>
  );
}
