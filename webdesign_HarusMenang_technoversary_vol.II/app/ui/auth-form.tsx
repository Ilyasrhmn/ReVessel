"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { currentProfile, enterDemo, loginAccount, registerAccount, useBrowserState } from "@/lib/browser/storage";
import type { Role } from "@/lib/browser/data";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dashboardHref, dashboardSection } from "../dashboard/sections";
import styles from "../dashboard/dashboard.module.css";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const section = dashboardSection(useSearchParams().get("bagian"));
  const router = useRouter();
  const state = useBrowserState();
  const user = state && state !== "unavailable" ? currentProfile(state) : null;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const registering = mode === "register";
  const destination = dashboardHref(section);
  const query = section === "ringkasan" ? "" : `?bagian=${section}`;

  useEffect(() => {
    if (user?.role) router.replace(user.role === "admin" ? "/dashboard/admin" : destination);
  }, [destination, router, user?.role]);

  async function demo(role: Role) {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await enterDemo(role);
    } catch {
      setError("Izinkan penyimpanan browser untuk memulai demo.");
      setPending(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();
    if (registering && !name) {
      setError("Masukkan namamu.");
      return;
    }
    setError("");
    setPending(true);
    try {
      const result = registering ? await registerAccount(name, email, password) : await loginAccount(email, password);
      if ("role" in result) return;
      setError(result.error ?? "Akun belum bisa dibuka.");
    } catch {
      setError("Akun gagal dibuka. Periksa penyimpanan browser dan coba lagi.");
    }
    setPending(false);
  }

  return (
    <>
      {!registering && (
        <section className={styles.demoLogin} aria-labelledby="demo-login-title">
          <h2 id="demo-login-title">Coba Demo</h2>
          <div className={styles.detailActions}>
            <Button type="button" variant="outline" disabled={pending} onClick={() => demo("admin")}>Demo sebagai Admin</Button>
            <Button type="button" variant="outline" disabled={pending} onClick={() => demo("resident")}>Demo sebagai Warga</Button>
          </div>
        </section>
      )}
      {!registering && <h2>Masuk dengan akun</h2>}
      <p className={styles.secondary}>Gunakan email dan kata sandi contoh.</p>
      <form className={styles.authForm} onSubmit={submit}>
        {registering && (
          <label className={styles.field}>
            <span>Nama</span>
            <input type="text" name="name" required maxLength={80} autoComplete="name" />
          </label>
        )}
        <label className={styles.field}>
          <span>Email</span>
          <input type="email" name="email" required maxLength={254} autoComplete="email" />
        </label>
        <div className={styles.field}>
          <label htmlFor="account-password">Kata sandi</label>
          <div className={styles.passwordField}>
            <input id="account-password" name="password" required type={visible ? "text" : "password"}
              autoComplete={registering ? "new-password" : "current-password"} minLength={registering ? 12 : undefined} maxLength={128}
              aria-describedby={registering ? "password-rule" : undefined} />
            <button type="button" className={styles.passwordToggle} aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} onClick={() => setVisible(!visible)}>
              {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </div>
          {registering && <p id="password-rule">Minimal 12 karakter.</p>}
        </div>
        <p role="alert" className={styles.feedback}>{error}</p>
        <Button type="submit" size="lg" disabled={pending}>
          {registering ? <UserPlus aria-hidden="true" /> : <LogIn aria-hidden="true" />}
          {pending ? (registering ? "Membuat akun…" : "Sedang masuk…") : (registering ? "Daftar" : "Masuk")}
        </Button>
      </form>
      <p>{registering ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
        <Link className={styles.authLink} href={`${registering ? "/masuk" : "/daftar"}${query}`}>{registering ? "Masuk" : "Daftar akun"}</Link>
      </p>
    </>
  );
}
