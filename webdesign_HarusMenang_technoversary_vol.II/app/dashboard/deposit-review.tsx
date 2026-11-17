"use client";

import { useState, type FormEvent } from "react";
import { Check, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adjustmentReasons, depositWeightLabel, fulfillmentLabels, statusLabels, type Deposit } from "./deposit-store";
import { maxWeightGrams } from "@/lib/browser/glass-value";
import type { Workspace } from "@/lib/browser/data";
import { reviewDetails } from "@/lib/browser/selectors";
import { decideApproval, lookupDeposit, submitReview } from "@/lib/browser/deposits";
import { isDepositPhoto } from "@/lib/browser/deposit-photo";
import { DepositPhoto } from "./deposit-photo";
import styles from "./dashboard.module.css";


export default function DepositReview({ initialCode, workspace, compact }: {
  initialCode?: string | null;
  workspace: Workspace;
  compact?: boolean;
}) {
  const [code, setCode] = useState(initialCode ?? "");
  const [selectedCode, setSelectedCode] = useState(initialCode ?? null);
  const result = selectedCode ? reviewDetails(workspace, selectedCode) : null;
  const deposit = result?.deposit;
  const pickup = result?.pickup;
  const photo = deposit?.photo;
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setNotice("");
    setSelectedCode(null);
    try {
      const result = lookupDeposit(code.trim().toUpperCase());
      if ("deposit" in result) setSelectedCode(result.deposit.code);
      else setNotice(result.error);
    } catch {
      setNotice("Pencarian belum selesai. Coba lagi.");
    }
  }

  async function approval(event: FormEvent<HTMLFormElement>, item: Deposit) {
    event.preventDefault();
    if (pending) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const form = new FormData(event.currentTarget, submitter);
    setNotice("");
    setPending(true);
    try {
      const result = await decideApproval(item.code, form);
      if ("deposit" in result && result.deposit) {
        setNotice("Keputusan tersimpan.");
      } else setNotice(result.error ?? "Setoran belum dapat diproses.");
    } catch {
      setNotice("Keputusan belum dapat dikonfirmasi. Coba lagi.");
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
      if ("deposit" in result && result.deposit) {
        setNotice("Hasil pemeriksaan tersimpan.");
      } else setNotice(result.error ?? "Setoran belum dapat diproses.");
    } catch {
      setNotice("Pemeriksaan belum tersimpan. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div id="pemeriksaan" className={styles.review} data-wide={compact}>
      <section className={styles.panel} aria-labelledby="lookup-title">
        <h2 id="lookup-title">Cari kode setoran</h2>
        <form className={styles.lookup} onSubmit={search}>
          <label className={styles.field}>
            <span>Kode setoran</span>
            <span className={styles.searchField}>
              <Search aria-hidden="true" />
              <input required maxLength={11} autoComplete="off" spellCheck={false}
                placeholder="RV-XXXXXXXX" value={code} disabled={pending}
                onChange={(event) => { setCode(event.target.value); setSelectedCode(null); setNotice(""); }} />
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
          <div className={styles.reviewMeta}>
            <div><p>{deposit.material}</p><p className={styles.cashoutNote}>{deposit.pointName}</p></div>
            <strong>{depositWeightLabel(deposit)}</strong>
          </div>
          {isDepositPhoto(photo) ? <DepositPhoto src={photo} /> : deposit.status === "pending_approval" && <p className={styles.secondary}>Foto setoran belum diunggah.</p>}
          {deposit.reason && <p className={styles.reason}>{deposit.reason}</p>}
          {deposit.approvalNote && <p className={styles.reason}>{deposit.approvalNote}</p>}
          {deposit.method && <p>{fulfillmentLabels[deposit.method]}</p>}
          {pickup && deposit.status === "waiting" && (
            <address className={styles.pickupAddress}>
              <p>{pickup.address}</p>
              <a className="link-reveal" href={`tel:${pickup.phone}`}><span>{pickup.phone}</span></a>
            </address>
          )}
          {deposit.status === "pending_approval" && (
            <form className={styles.fields} onSubmit={(event) => approval(event, deposit)}>
              <label className={styles.field}>Alasan jika ditolak
                <textarea name="note" rows={2} maxLength={240} />
              </label>
              <div className={styles.detailActions}>
                <Button name="decision" value="approve" type="submit" disabled={pending || !isDepositPhoto(photo)}><Check aria-hidden="true" />Setujui pengajuan</Button>
                <Button name="decision" value="reject" type="submit" variant="outline" disabled={pending}><X aria-hidden="true" />Tolak pengajuan</Button>
              </div>
            </form>
          )}
          {deposit.status === "waiting" && (
            <form key={deposit.code} className={styles.fields} onSubmit={(event) => review(event, deposit)}>
              <label className={styles.check}>
                <input type="checkbox" name="verified" />
                <span>Kondisi dan jenis kaca sudah diperiksa.</span>
              </label>
              <label className={styles.field}>
                <span>Alasan penyesuaian jika ada</span>
                <select name="reason" defaultValue="">
                  <option value="">Tidak ada penyesuaian</option>
                  {adjustmentReasons.map((reason) => <option key={reason}>{reason}</option>)}
                </select>
              </label>
              <label className={styles.field}>Berat bersih kaca (g)
                <input type="number" name="weightGrams" inputMode="numeric" min={1} max={maxWeightGrams} step={1} />
              </label>
              <Button type="submit" className={styles.action} disabled={pending}>Simpan pemeriksaan</Button>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
