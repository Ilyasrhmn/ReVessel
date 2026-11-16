const sectionIds = ["ringkasan", "setoran", "titik-kumpul", "panduan", "pemeriksaan"] as const;
export type DashboardSection = (typeof sectionIds)[number];

export function dashboardSection(value: unknown): DashboardSection {
  return sectionIds.find((section) => section === value) ?? "ringkasan";
}

export function dashboardHref(section: DashboardSection) {
  return section === "ringkasan" ? "/dashboard" : `/dashboard?bagian=${section}`;
}

export function loginHref(section: DashboardSection) {
  const query = new URLSearchParams();
  if (section !== "ringkasan") query.set("bagian", section);
  return query.size ? `/masuk?${query}` : "/masuk";
}
