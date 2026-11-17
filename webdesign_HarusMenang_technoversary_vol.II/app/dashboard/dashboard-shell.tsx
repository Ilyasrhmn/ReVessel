"use client";

import Link from "next/link";
import { Bell, LogOut, Moon, Sun, UserRound } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BrandSymbol } from "../ui/brand-logo";
import NavBubble from "../ui/nav-bubble";
import SessionSubmit from "../ui/session-submit";
import { useDashboardPreferences } from "@/lib/browser/preferences";
import { logoutAccount } from "@/lib/browser/storage";
import styles from "./dashboard.module.css";

export type DashboardLink = {
  id: string;
  href: string;
  label: string;
  icon: ReactNode;
  count?: number;
};

export default function DashboardShell({
  view, title, homeHref, profile, items, shortcuts, activity, primaryAction, dockAction, overlay, children,
}: {
  view: string;
  title: string;
  homeHref: string;
  profile: { name: string; role: string };
  items: DashboardLink[];
  shortcuts: DashboardLink[];
  activity?: { href: string; label: string };
  primaryAction?: ReactNode;
  dockAction?: ReactNode;
  overlay?: ReactNode;
  children: ReactNode;
}) {
  const { preferences: { dark }, setPreferences } = useDashboardPreferences();
  const [logoutError, setLogoutError] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const accountRef = useRef<HTMLDetailsElement>(null);
  const previousView = useRef(view);

  useEffect(() => {
    document.title = `${title} | ReVessel`;
    const nav = navRef.current;
    const currentLink = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && currentLink && nav.scrollWidth > nav.clientWidth) {
      const target = currentLink.offsetLeft - (nav.clientWidth - currentLink.offsetWidth) / 2;
      const smooth = previousView.current !== view && !matchMedia("(prefers-reduced-motion: reduce)").matches;
      nav.scrollTo({ left: target, behavior: smooth ? "smooth" : "instant" });
    }
    if (previousView.current === view) return;
    previousView.current = view;
    if (accountRef.current) accountRef.current.open = false;
    if (window.location.hash) return;
    window.scrollTo({ top: 0, behavior: "instant" });
    titleRef.current?.focus({ preventScroll: true });
  }, [title, view]);

  useEffect(() => {
    function closeAccount(event: PointerEvent) {
      const menu = accountRef.current;
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) menu.open = false;
    }
    document.addEventListener("pointerdown", closeAccount);
    return () => document.removeEventListener("pointerdown", closeAccount);
  }, []);

  return (
    <div className={styles.dashboard} data-dark={dark}>
      <a href="#main" className={styles.skipLink}>Lewati ke konten</a>
      <header className={styles.topbar}>
        <Link href={homeHref} className={styles.brand} aria-label="Dashboard ReVessel">
          <span className={styles.brandMark}><BrandSymbol /></span>
          ReVessel
        </Link>
        <nav ref={navRef} className={styles.topNav} aria-label="Navigasi dashboard">
          <NavBubble active={view} />
          {items.map(({ id, href, icon, label, count }) => (
            <Link key={id} href={href} data-nav-item={id} aria-current={view === id ? "page" : undefined}>
              {icon}
              {label}
              {Boolean(count) && <span className={styles.navCount}>{count}</span>}
            </Link>
          ))}
          {primaryAction}
        </nav>
        <div className={styles.headerTools}>
          {activity && (
            <Button asChild variant="ghost" size="icon" className={styles.circleButton}>
              <Link href={activity.href} aria-label={activity.label}><Bell aria-hidden="true" /></Link>
            </Button>
          )}
          <details ref={accountRef} className={styles.account} onKeyDown={(event) => {
            if (event.key !== "Escape" || !event.currentTarget.open) return;
            event.preventDefault();
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
          }}>
            <summary className={styles.avatar} aria-label="Akun"><UserRound aria-hidden="true" /></summary>
            <div className={styles.accountMenu}>
              <p>{profile.name}</p>
              <form action={async () => {
                setLogoutError(false);
                try { await logoutAccount(); }
                catch { setLogoutError(true); }
              }}>
                <SessionSubmit idle="Keluar" pending="Sedang keluar…" icon={<LogOut aria-hidden="true" />} />
              </form>
              {logoutError && <p role="alert">Sesi gagal diakhiri. Coba lagi.</p>}
            </div>
          </details>
        </div>
      </header>

      <TooltipProvider delayDuration={180}>
        <nav className={styles.dock} aria-label="Pintasan dashboard">
          {shortcuts.map(({ id, href, label, icon }) => (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <Link href={href} aria-label={label} aria-current={view === id ? "page" : undefined}>{icon}</Link>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ))}
          {dockAction}
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label="Tema gelap" aria-pressed={dark} onClick={() => setPreferences({ dark: !dark })}>
                {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{dark ? "Tema terang" : "Tema gelap"}</TooltipContent>
          </Tooltip>
        </nav>
      </TooltipProvider>

      <main id="main" className={styles.main} tabIndex={-1}>
        <header className={styles.header}>
          <h1 ref={titleRef} tabIndex={-1}>{title}</h1>
          <Badge className={styles.roleBadge} variant="outline">{profile.role}</Badge>
        </header>
        <div key={view} className={styles.appear}>{children}</div>
      </main>
      {overlay}
    </div>
  );
}
