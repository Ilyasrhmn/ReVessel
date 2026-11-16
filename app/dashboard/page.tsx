import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { currentUser } from "@/lib/server/auth";
import { collectionPoints, listResidentDeposits } from "@/lib/server/deposits";
import { readResidentRewards } from "@/lib/server/rewards";
import DepositDashboard from "./deposit-dashboard";
import { dashboardHref, dashboardSection, loginHref } from "./sections";

export const metadata: Metadata = {
  title: "Dashboard Setoran | ReVessel",
  description: "Kelola setoran botol kaca dan lihat hasil pemeriksaannya.",
};

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted" role="status">Memuat dashboard…</p>}>
      <AuthorizedDashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function AuthorizedDashboard({ searchParams }: Pick<PageProps<"/dashboard">, "searchParams">) {
  const section = dashboardSection((await searchParams).bagian);
  const user = await currentUser();
  if (!user) redirect(loginHref(section));
  if (user.role === "admin") redirect("/dashboard/admin");
  const role = user.role === "reviewer" ? "reviewer" : "resident";
  if (role === "resident" && section === "pemeriksaan") redirect(dashboardHref("ringkasan"));
  if (role === "reviewer" && (section === "ringkasan" || section === "setoran" || section === "poin")) redirect(dashboardHref("pemeriksaan"));

  const [points, deposits, rewards] = await Promise.all([
    collectionPoints(role === "reviewer" ? user.id : undefined),
    role === "resident" ? listResidentDeposits(user.id) : [],
    role === "resident" && section === "poin" ? readResidentRewards(user.id) : null,
  ]);
  return <DepositDashboard deposits={deposits} points={points} rewards={rewards} profile={{ name: user.name, role }} />;
}
