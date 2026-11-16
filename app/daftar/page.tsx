import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { currentUser } from "@/lib/server/auth";
import BrandLogo from "../ui/brand-logo";
import AuthForm from "../ui/auth-form";
import { dashboardHref, dashboardSection } from "../dashboard/sections";
import styles from "../dashboard/dashboard.module.css";

export const metadata: Metadata = { title: "Daftar | ReVessel" };

async function Registration({ searchParams }: PageProps<"/daftar">) {
  const section = dashboardSection((await searchParams).bagian);
  if (await currentUser()) redirect(dashboardHref(section));
  return (
    <main id="main" className={styles.login}>
      <Card className={styles.loginCard}>
        <span className={styles.brand}><BrandLogo /></span>
        <h1>Daftar akun</h1>
        <AuthForm mode="register" section={section} />
      </Card>
    </main>
  );
}

export default function RegisterPage(props: PageProps<"/daftar">) {
  return <Suspense fallback={<p className="p-8 text-sm text-muted" role="status">Memuat pendaftaran…</p>}><Registration {...props} /></Suspense>;
}
