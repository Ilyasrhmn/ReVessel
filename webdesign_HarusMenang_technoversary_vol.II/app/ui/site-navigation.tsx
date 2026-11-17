"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import Icon from "./interface-icon";
import BrandLogo from "./brand-logo";
import NavBubble from "./nav-bubble";
import glass from "./liquid-glass.module.css";
import styles from "./site-navigation.module.css";
import { moveGlassLight } from "./glass-light";
import { bottleChecklist } from "../bottle-guide";

const menuLinks = [
  { path: "/", label: "Beranda", icon: "home" },
  { path: "/tentang", label: "Tentang", icon: "about" },
  { path: "/galeri", label: "Galeri", icon: "gallery" },
  { path: "/artikel", label: "Artikel", icon: "article" },
  { path: "/kontak", label: "Kontak", icon: "contact" },
] as const;

function SectionLink({
  home,
  section,
  onSectionNavigate,
  ...props
}: ComponentPropsWithoutRef<"a"> & {
  home: boolean;
  section: string;
  onSectionNavigate: (id: string) => void;
}) {
  if (!home) {
    return (
      <Link
        {...props}
        href={`/#${section}`}
        onNavigate={() => onSectionNavigate(section)}
      />
    );
  }

  return (
    <a
      {...props}
      href={`#${section}`}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        onSectionNavigate(section);
      }}
    />
  );
}

const BottleGuide = createContext<(trigger: HTMLButtonElement) => void>(() => {});

export function useBottleGuide() {
  return useContext(BottleGuide);
}

export default function SiteNavigation({ children }: { children: ReactNode }) {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname === "/masuk" || pathname === "/daftar") return children;
  return <PublicNavigation pathname={pathname}>{children}</PublicNavigation>;
}

function PublicNavigation({ children, pathname }: { children: ReactNode; pathname: string }) {
  const home = pathname === "/";
  const detailPath = menuLinks.find(
    ({ path }) => path !== "/" && (pathname === path || pathname.startsWith(`${path}/`)),
  )?.path;
  const navRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const goingToCollection = useRef(false);
  const [checks, setChecks] = useState(() => bottleChecklist.map(() => false));
  const complete = checks.every(Boolean);
  const [navTone, setNavTone] = useState("dark");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!home) return;
    let frame = 0;
    function update() {
      frame = 0;
      const nav = navRef.current?.getBoundingClientRect();
      const hero = document.getElementById("beranda")?.getBoundingClientRect();
      const story = document.getElementById("perjalanan")?.getBoundingClientRect();
      if (!nav) return;
      const center = nav.top + nav.height / 2;
      const gallery = document.querySelector("[data-paper-window]")?.getBoundingClientRect();
      const overStory = (story && story.top <= center && story.bottom > center) ||
        (gallery && gallery.top <= center && gallery.bottom > center);
      const overHero =
        hero && hero.top <= center && hero.bottom > Math.max(center, hero.height * 0.25);
      setNavTone(overStory || (overHero && window.innerWidth > 760) ? "dark" : "light");
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [home]);

  useEffect(() => {
    function keepFocusAboveDock(event: FocusEvent) {
      const target = event.target;
      const nav = navRef.current;
      if (!(target instanceof HTMLElement) || !nav || !target.closest("#main, footer")) return;
      if (!matchMedia("(max-width: 760px)").matches || !target.matches(":focus-visible")) return;

      const inset = nav.getBoundingClientRect();
      const rect = target.getBoundingClientRect();
      if (
        rect.top < inset.bottom && rect.bottom > inset.top &&
        rect.left < inset.right && rect.right > inset.left
      ) {
        window.scrollBy({ top: rect.bottom - inset.top + 12, behavior: "instant" });
      }
    }

    document.addEventListener("focusin", keepFocusAboveDock);
    return () => document.removeEventListener("focusin", keepFocusAboveDock);
  }, []);

  function onSectionNavigate(id: string) {
    setMenuOpen(false);
    if (home) {
      requestAnimationFrame(() => document.getElementById(id)?.focus({ preventScroll: true }));
    }
  }

  useEffect(() => {
    if (!menuOpen) return;

    function dismissOnPointer(event: PointerEvent) {
      if (!(event.target instanceof Node)) return;
      if (
        menuRef.current?.contains(event.target) ||
        menuTriggerRef.current?.contains(event.target)
      ) return;
      setMenuOpen(false);
    }

    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuTriggerRef.current?.focus();
    }

    const closeOnHistory = () => setMenuOpen(false);
    window.addEventListener("pointerdown", dismissOnPointer);
    window.addEventListener("keydown", dismissOnEscape);
    window.addEventListener("popstate", closeOnHistory);
    return () => {
      window.removeEventListener("pointerdown", dismissOnPointer);
      window.removeEventListener("keydown", dismissOnEscape);
      window.removeEventListener("popstate", closeOnHistory);
    };
  }, [menuOpen]);

  function openGuide(trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    setMenuOpen(false);
    dialogRef.current?.showModal();
  }

  return (
    <BottleGuide.Provider value={openGuide}>
      <a className={styles.skip} href="#main">Lewati navigasi</a>
      <header className={styles.header} data-home={home}>
        <SectionLink
          home={home}
          section="beranda"
          onSectionNavigate={onSectionNavigate}
          className={styles.brand}
          aria-label="ReVessel, beranda"
          data-fluid-hero-brand={home ? "" : undefined}
        >
          <BrandLogo />
        </SectionLink>
        {home ? (
          <div className={styles.navigation}>
            <nav
              ref={navRef}
              data-tone={navTone}
              className={`${styles.nav} ${glass.surface}`}
              aria-label="Navigasi utama"
            >
              <NavBubble active={menuOpen ? "menu" : "guide"} />
              <Link href="/masuk" className={styles.loginLink}>
                <LogIn aria-hidden="true" />
                <span>Masuk</span>
              </Link>
              <button
                data-nav-item="guide"
                aria-haspopup="dialog"
                onClick={(event) => openGuide(event.currentTarget)}
              >
                <Icon kind="bottle" />
                <span>Siapkan botol</span>
              </button>
              <button
                ref={menuTriggerRef}
                data-nav-item="menu"
                aria-expanded={menuOpen}
                aria-controls="site-menu"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className={styles.menuToggleIcon}>
                  <Icon kind="plus" />
                </span>
                <span>Menu</span>
              </button>
            </nav>
            <nav
              id="site-menu"
              data-glass-scroll=""
              data-lenis-prevent=""
              ref={menuRef}
              className={`${styles.siteMenu} ${glass.surface}`}
              data-tone={navTone}
              data-open={menuOpen}
              inert={!menuOpen}
              onPointerMove={moveGlassLight}
              aria-label="Menu halaman ReVessel"
            >
              {menuLinks.map(({ path, label, icon }, index) => (
                <Link
                  key={path}
                  href={path}
                  onNavigate={() => {
                    setMenuOpen(false);
                    if (path === "/") {
                      document.getElementById("beranda")?.scrollIntoView();
                      onSectionNavigate("beranda");
                    }
                  }}
                  style={{ "--menu-index": index } as CSSProperties}
                >
                  <Icon kind={icon} />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        ) : (
          <div className={`${styles.navigation} ${styles.detailNavigation}`}>
            <nav
              ref={navRef}
              className={`${styles.nav} ${glass.surface}`}
              aria-label="Navigasi utama"
            >
              {detailPath && <NavBubble active={detailPath} />}
              {menuLinks.map(({ path, label, icon }) => (
                <Link
                  key={path}
                  href={path}
                  data-nav-item={path}
                  aria-current={path === detailPath ? "page" : undefined}
                >
                  <Icon kind={icon} />
                  <span>{path === "/" ? "Home" : label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {children}
      <dialog
        ref={dialogRef}
        data-glass-scroll=""
        data-lenis-prevent=""
        className={styles.dialog}
        aria-labelledby="guide-title"
        onClose={() => {
          if (!goingToCollection.current) triggerRef.current?.focus({ preventScroll: true });
          goingToCollection.current = false;
        }}
      >
        <button
          className={styles.dialogClose}
          aria-label="Tutup panduan"
          onClick={() => dialogRef.current?.close()}
        >
          <Icon kind="close" />
        </button>
        <h2 id="guide-title">Siapkan botol</h2>
        <div className={styles.checklist}>
          {bottleChecklist.map((text, index) => (
            <label key={text}>
              <input
                type="checkbox"
                checked={checks[index]}
                onChange={(event) => {
                  const checked = event.currentTarget.checked;
                  setChecks((current) => current.map((value, i) => i === index ? checked : value));
                }}
              />
              <span>{text}</span>
            </label>
          ))}
        </div>
        <p role="status" className={styles.guideStatus}>
          {complete
            ? "Botolmu sudah disiapkan. Cek jenis botol yang diterima titik kumpul."
            : `${checks.filter(Boolean).length} dari ${checks.length} langkah selesai`}
        </p>
        {complete && (
          <a
            className={styles.guideNext}
            href={home ? "#titik-kumpul" : "/#titik-kumpul"}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              goingToCollection.current = true;
              dialogRef.current?.close();
              if (home) document.getElementById("titik-kumpul")?.focus({ preventScroll: true });
            }}
          >
            Lihat titik kumpul <Icon kind="down" />
          </a>
        )}
      </dialog>
    </BottleGuide.Provider>
  );
}
