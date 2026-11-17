"use client";

import Link from "next/link";
import { useEffect, useId, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currentProfile, enterDemo, loginAccount, minPasswordLength, registerAccount, useBrowserState } from "@/lib/browser/storage";
import type { Role } from "@/lib/browser/data";
import { dashboardHref, dashboardSection } from "../dashboard/sections";
import AuthSkeleton from "./auth-skeleton";
import styles from "./auth.module.css";

function PasswordField({
  name, label, registering, hint, invalid, onChange,
}: {
  name: string;
  label: string;
  registering: boolean;
  hint?: string;
  invalid?: boolean;
  onChange?: () => void;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const description = [hint && `${id}-hint`, invalid && "auth-error"].filter(Boolean).join(" ") || undefined;

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.passwordField}>
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={registering ? "new-password" : "current-password"}
          minLength={registering ? minPasswordLength : undefined}
          maxLength={128}
          required
          aria-describedby={description}
          aria-invalid={invalid || undefined}
          onChange={onChange}
        />
        <button
          type="button"
          className={styles.passwordToggle}
          aria-label={`${visible ? "Sembunyikan" : "Tampilkan"} ${label.toLowerCase()}`}
          aria-controls={id}
          onClick={() => setVisible((shown) => !shown)}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
      {hint && <small id={`${id}-hint`} className={styles.hint}>{hint}</small>}
    </div>
  );
}

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const section = dashboardSection(useSearchParams().get("bagian"));
  const router = useRouter();
  const state = useBrowserState();
  const user = state && state !== "unavailable" ? currentProfile(state) : null;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ text: string; field?: "confirm"; source: "account" | "demo" } | null>(null);
  const registering = mode === "register";
  const destination = dashboardHref(section);
  const query = section === "ringkasan" ? "" : `?bagian=${section}`;

  useEffect(() => {
    if (user?.role) router.replace(user.role === "admin" ? "/dashboard/admin" : destination);
  }, [destination, router, user?.role]);

  async function demo(role: Role) {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await enterDemo(role);
    } catch {
      setError({ text: "Izinkan penyimpanan browser untuk melanjutkan.", source: "demo" });
      setPending(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "");
    if (registering && password !== form.get("confirm")) {
      setError({ text: "Konfirmasi kata sandi harus sama.", field: "confirm", source: "account" });
      event.currentTarget.querySelector<HTMLInputElement>('input[name="confirm"]')?.focus();
      return;
    }

    setError(null);
    setPending(true);
    try {
      const result = registering ? await registerAccount(name, email, password) : await loginAccount(email, password);
      if ("role" in result) return;
      setError({ text: result.error ?? "Akun belum bisa dibuka.", source: "account" });
    } catch {
      setError({ text: "Akun gagal dibuka. Periksa penyimpanan browser dan coba lagi.", source: "account" });
    }
    setPending(false);
  }

  function clearConfirmationError() {
    if (error?.field === "confirm") setError(null);
  }

  const loading = state === null || pending || user !== null;

  return (
    <>
      {loading && <AuthSkeleton registering={registering} />}
      <div className={styles.authContent} hidden={loading}>
        <form className={styles.form} onSubmit={submit}>
          {registering && (
            <label className={styles.field}>
              <span>Nama</span>
              <input type="text" name="name" required maxLength={80} autoComplete="name" />
            </label>
          )}
          <label className={styles.field}>
            <span>Email</span>
            <input type="email" name="email" required maxLength={254} autoComplete="email" placeholder="user@revessel.com" />
          </label>
          <PasswordField
            name="password"
            label="Kata sandi"
            registering={registering}
            hint={registering ? "Minimal " + minPasswordLength + " karakter." : undefined}
            onChange={clearConfirmationError}
          />
          {registering && (
            <PasswordField
              name="confirm"
              label="Konfirmasi kata sandi"
              registering
              invalid={error?.field === "confirm"}
              onChange={clearConfirmationError}
            />
          )}
          {error?.source === "account" && <p id="auth-error" className={styles.feedback} role="alert">{error.text}</p>}
          <Button className={styles.submit} type="submit" size="lg">
            {registering ? <UserPlus aria-hidden="true" /> : <LogIn aria-hidden="true" />}
            {registering ? "Daftar" : "Masuk"}
          </Button>
        </form>

        {!registering && (
          <section className={styles.demo} aria-labelledby="demo-login-title">
            <h2 id="demo-login-title">Akses lokal</h2>
            <div className={styles.demoActions}>
              <Button type="button" variant="outline" onClick={() => demo("admin")}>
                Lanjut sebagai Admin
              </Button>
              <Button type="button" variant="outline" onClick={() => demo("resident")}>
                Lanjut sebagai Warga
              </Button>
            </div>
            {error?.source === "demo" && <p className={styles.feedback} role="alert">{error.text}</p>}
          </section>
        )}

        <p className={styles.switch}>
          {registering ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
          <Link className="link-reveal" href={`${registering ? "/masuk" : "/daftar"}${query}`}>
            <span>{registering ? "Masuk" : "Daftar akun"}</span>
          </Link>
        </p>
      </div>
    </>
  );
}
