"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { currentProfile, useBrowserState } from "@/lib/browser/storage";
import type { BrowserState, Mode, Profile, Role } from "@/lib/browser/data";

export default function BrowserGate({ role, loginHref, children }: {
  role: Role;
  loginHref: string;
  children: (state: BrowserState, user: Profile & { mode: Mode }) => ReactNode;
}) {
  const state = useBrowserState();
  const user = state && state !== "unavailable" ? currentProfile(state) : null;
  const router = useRouter();
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const target = !state || state === "unavailable" ? null : !user ? loginHref : user.role === role ? null
    : user.role === "admin" ? "/dashboard/admin" : "/dashboard";

  useEffect(() => {
    if (target && target !== pathname) router.replace(target);
  }, [pathname, router, target]);

  if (state === "unavailable") return <p className="p-8" role="alert">Aktifkan penyimpanan browser untuk membuka dashboard.</p>;
  if (!state || !user || target) return <p className="p-8 text-sm text-muted" role="status">Memuat dashboard…</p>;
  return children(state, user);
}
