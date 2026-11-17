import Link from "next/link";
import { Suspense } from "react";
import AuthForm from "./auth-form";
import AuthSkeleton from "./auth-skeleton";
import BrandLogo from "./brand-logo";
import styles from "./auth.module.css";

export default function AuthScreen({ mode }: { mode: "login" | "register" }) {
  const registering = mode === "register";

  return (
    <main id="main" className={styles.screen}>
      <section className={styles.card} data-mode={mode} aria-labelledby="auth-title">
        <Link href="/" className={styles.brand} aria-label="Beranda ReVessel"><BrandLogo /></Link>
        <h1 className={styles.title} id="auth-title">{registering ? "Daftar akun" : "Masuk dengan akun"}</h1>
        <Suspense fallback={<AuthSkeleton registering={registering} />}>
          <AuthForm mode={mode} />
        </Suspense>
      </section>
    </main>
  );
}
