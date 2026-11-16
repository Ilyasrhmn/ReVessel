import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import BrandLogo from "../ui/brand-logo";
import { currentUser } from "@/lib/server/auth";
import AuthForm from "../ui/auth-form";
import styles from "../dashboard/dashboard.module.css";
import { dashboardHref, dashboardSection } from "../dashboard/sections";

export const metadata: Metadata = { title: "Masuk | ReVessel" };

async function LoginForm({ searchParams }: PageProps<"/masuk">) {
  const query = await searchParams;
  const section = dashboardSection(query.bagian);
  if (await currentUser()) redirect(dashboardHref(section));

  return (
    <main id="main" className={styles.login}>
      <Card className={styles.loginCard}>
        <span className={styles.brand}><BrandLogo /></span>
        <h1>Masuk ke dashboard</h1>
        <AuthForm mode="login" section={section} />
      </Card>
    </main>
  );
}

export default function LoginPage(props: PageProps<"/masuk">) {
  return <Suspense fallback={<p className="p-8 text-sm text-muted" role="status">Memuat halaman masuk…</p>}><LoginForm {...props} /></Suspense>;
}
