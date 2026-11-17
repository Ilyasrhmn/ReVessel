import type { Metadata } from "next";
import { Suspense } from "react";
import AdminDashboard from "./admin-dashboard";
import DashboardSkeleton from "../dashboard-skeleton";

export const metadata: Metadata = { title: "Dashboard admin | ReVessel" };

export default function AdminPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AdminDashboard />
    </Suspense>
  );
}
