"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createAuthClient } from "better-auth/react";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dashboardHref, type DashboardSection } from "../dashboard/sections";
import styles from "../dashboard/dashboard.module.css";

const client = createAuthClient();

export default function AuthForm({ mode, section }: { mode: "login" | "register"; section: DashboardSection }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const registering = mode === "register";
  const destination = dashboardHref(section);
  const query = section === "ringkasan" ? "" : `?bagian=${section}`;

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
      const result = registering
        ? await client.signUp.email({ name, email, password })
        : await client.signIn.email({ email, password });
      if (!result.error) {
        window.location.replace(destination);
        return;
      }
      if (result.error.status === 429) setError("Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba lagi.");
      else if (result.error.status >= 500) setError("Layanan akun sedang tidak tersedia. Coba lagi nanti.");
      else if (registering) setError("Akun belum bisa dibuat. Periksa email dan kata sandi, atau masuk jika sudah terdaftar.");
      else setError("Email atau kata sandi salah. Periksa lagi dan coba masuk.");
    } catch {
      setError("Koneksi terputus. Coba lagi saat internet tersedia.");
    }
    setPending(false);
  }

  return (
    <>
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
