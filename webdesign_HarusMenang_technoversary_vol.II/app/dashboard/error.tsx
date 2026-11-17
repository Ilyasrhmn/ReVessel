"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from "./dashboard.module.css";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <main id="main" className={styles.login}>
      <section className={`${styles.panel} ${styles.loginCard}`}>
        <h1>Dashboard belum bisa dimuat</h1>
        <p role="alert">Coba muat ulang untuk membuka setoranmu.</p>
        <Button type="button" onClick={reset}><RotateCw aria-hidden="true" /> Muat ulang</Button>
      </section>
    </main>
  );
}
