import type { Metadata } from "next";
import { Suspense } from "react";
import ResidentPage from "./resident-page";
import DashboardSkeleton from "./dashboard-skeleton";

export const metadata: Metadata = {
  title: "Dashboard Setoran | ReVessel",
  description: "Kelola setoran botol kaca dan lihat hasil pemeriksaannya.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ResidentPage />
    </Suspense>
  );
}
