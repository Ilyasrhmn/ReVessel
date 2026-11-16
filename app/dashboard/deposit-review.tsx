"use client";

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adjustmentReasons, statusLabels, type Deposit } from "./deposit-store";
import { lookupDeposit, submitReview } from "./deposit-actions";
import styles from "./dashboard.module.css";


export default function DepositReview() {
  const [code, setCode] = useState("");
  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setDeposit(null);
    setPending(true);
    try {
      const result = await lookupDeposit(code.trim().toUpperCase());
      if (result.deposit) setDeposit(result.deposit);
      else setNotice(result.error);
    } catch {
      setNotice("Pencarian belum selesai. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  async function review(event: FormEvent<HTMLFormElement>, item: Deposit) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setNotice("");
    setPending(true);
    try {
      const result = await submitReview(item.code, form);
      if (result.deposit) {
        setDeposit(result.deposit);
        setNotice("Hasil pemeriksaan tersimpan.");
      } else setNotice(result.error);
    } catch {
      setNotice("Pemeriksaan belum tersimpan. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.review}>
      <section className={styles.panel} aria-labelledby="lookup-title">
        <h2 id="lookup-title">Cari kode setoran</h2>
        <form className={styles.lookup} onSubmit={search}>
          <label className={styles.field}>
            <span>Kode setoran</span>
            <span className={styles.searchField}>
              <Search aria-hidden="true" />
              <input required maxLength={11} autoComplete="off" spellCheck={false}
                placeholder="RV-XXXXXXXX" value={code} disabled={pending}
                onChange={(event) => { setCode(event.target.value); setDeposit(null); setNotice(""); }} />
            </span>
          </label>
          <Button type="submit" className={styles.action} disabled={pending}>Cari setoran</Button>
        </form>
        <p role="status" className={styles.feedback}>{notice}</p>
      </section>

      {deposit && (
        <section className={`${styles.panel} ${styles.appear}`} aria-labelledby="review-title">
          <div className={styles.panelHeading}>
            <h2 id="review-title">{deposit.code}</h2>
            <Badge className={styles.status} variant="secondary" data-state={deposit.status}>{statusLabels[deposit.status]}</Badge>
          </div>
          <p className={styles.secondary}>{deposit.quantity} wadah · {deposit.material} · {deposit.pointName}</p>
          {deposit.reason && <p className={styles.reason}>{deposit.reason}</p>}
          {deposit.status === "waiting" && (
            <form key={deposit.code} className={styles.fields} onSubmit={(event) => review(event, deposit)}>
              <label className={styles.check}>
                <input type="checkbox" name="verified" />
                <span>Kondisi, jenis, dan jumlah botol sudah sesuai.</span>
              </label>
              <label className={styles.field}>
                <span>Alasan penyesuaian jika ada</span>
                <select name="reason" defaultValue="">
                  <option value="">Tidak ada penyesuaian</option>
                  {adjustmentReasons.map((reason) => <option key={reason}>{reason}</option>)}
                </select>
              </label>
              <Button type="submit" className={styles.action} disabled={pending}>Simpan pemeriksaan</Button>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
