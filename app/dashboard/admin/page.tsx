import type { Metadata } from "next";
import { Suspense } from "react";
import AdminDashboard from "./admin-dashboard";

export const metadata: Metadata = { title: "Dashboard admin | ReVessel" };

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted" role="status">Memuat dashboard…</p>}>
      <AdminDashboard />
    </Suspense>
  );
}
