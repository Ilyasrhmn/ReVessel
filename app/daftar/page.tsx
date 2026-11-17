import type { Metadata } from "next";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import BrandLogo from "../ui/brand-logo";
import AuthForm from "../ui/auth-form";
import styles from "../dashboard/dashboard.module.css";

export const metadata: Metadata = { title: "Daftar | ReVessel" };

export default function RegisterPage() {
  return (
    <main id="main" className={styles.login}>
      <Card className={styles.loginCard}>
        <span className={styles.brand}><BrandLogo /></span>
        <h1>Daftar akun</h1>
        <Suspense fallback={<p role="status">Memuat pendaftaran…</p>}><AuthForm mode="register" /></Suspense>
      </Card>
    </main>
  );
}
