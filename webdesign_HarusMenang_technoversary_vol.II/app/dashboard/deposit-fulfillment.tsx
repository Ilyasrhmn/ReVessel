"use client";

import { useState, type FormEvent } from "react";
import { MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chooseFulfillment } from "@/lib/browser/deposits";
import type { FulfillmentMethod } from "./deposit-store";
import styles from "./dashboard.module.css";

export default function DepositFulfillment({ code }: { code: string }) {
  const [method, setMethod] = useState<FulfillmentMethod>("dropoff");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setError("");
    setPending(true);
    try {
      const result = await chooseFulfillment(code, form);
      if (result.error) setError(result.error);
    } catch {
      setError("Pilihan belum dapat dikonfirmasi. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className={styles.fields} onSubmit={submit}>
      <fieldset className={styles.fields}>
        <legend className={styles.subheading}>Cara serah terima</legend>
        <label className={styles.check}>
          <input type="radio" name="method" value="dropoff" checked={method === "dropoff"} onChange={() => setMethod("dropoff")} />
          <MapPin size={16} aria-hidden="true" /> Antar sendiri
        </label>
        <label className={styles.check}>
          <input type="radio" name="method" value="pickup" checked={method === "pickup"} onChange={() => setMethod("pickup")} />
          <Truck size={16} aria-hidden="true" /> Minta dijemput
        </label>
      </fieldset>
      {method === "pickup" && (
        <div className={`${styles.fields} ${styles.appear}`}>
          <label className={styles.field}>Alamat penjemputan contoh
            <textarea name="address" required minLength={10} maxLength={400} rows={2} autoComplete="street-address" />
          </label>
          <label className={styles.field}>Nomor HP contoh
            <input name="phone" type="tel" required maxLength={24} autoComplete="tel" />
          </label>
          <label className={styles.check}>
            <input type="checkbox" name="share" required />
            <span>Gunakan data contoh untuk simulasi penjemputan.</span>
          </label>
        </div>
      )}
      {error && <p className={styles.feedback} role="alert">{error}</p>}
      <Button type="submit" className={styles.action} disabled={pending}>
        {pending ? "Menyimpan…" : method === "pickup" ? "Minta penjemputan" : "Konfirmasi antar sendiri"}
      </Button>
    </form>
  );
}
