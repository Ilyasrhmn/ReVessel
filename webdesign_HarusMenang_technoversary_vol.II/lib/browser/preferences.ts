"use client";

import { analyticsPeriods, materials } from "@/app/deposit-options";
import type { DashboardPreferences } from "./data";
import { changeState, currentProfile, useBrowserState } from "./storage";

const defaults: DashboardPreferences = { dark: false, period: 30, material: "all", compare: true };

function dashboardPreferences(saved?: DashboardPreferences): DashboardPreferences {
  return {
    dark: typeof saved?.dark === "boolean" ? saved.dark : defaults.dark,
    period: analyticsPeriods.find(([days]) => days === saved?.period)?.[0] ?? defaults.period,
    material: saved && (saved.material === "all" || materials.some((kind) => kind === saved.material))
      ? saved.material : defaults.material,
    compare: typeof saved?.compare === "boolean" ? saved.compare : defaults.compare,
  };
}

export function useDashboardPreferences() {
  const state = useBrowserState();
  const profile = state && state !== "unavailable" ? currentProfile(state) : null;
  const key = profile ? `${profile.mode}:${profile.id}` : null;
  const preferences = dashboardPreferences(key && state && state !== "unavailable" ? state.preferences?.[key] : undefined);

  function setPreferences(update: Partial<DashboardPreferences>) {
    if (!profile || !key) return;
    void changeState((draft) => {
      const user = currentProfile(draft);
      if (user?.id !== profile.id || user.mode !== profile.mode) return;
      const settings = draft.preferences ??= {};
      settings[key] = { ...dashboardPreferences(settings[key]), ...update };
    }).catch(() => {
      // Keep the persisted value if browser storage rejects the write.
    });
  }

  return { preferences, setPreferences };
}
