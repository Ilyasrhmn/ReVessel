"use client";

import { useRef, useState, type FormEvent } from "react";
import { History, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createBrowserId } from "@/lib/browser/id";
import type { Cashout } from "@/lib/browser/data";
import { cashoutStatus, redeemCash, requestCashout, reviewCashout } from "@/lib/browser/cashouts";
import { cashoutTotals } from "@/lib/browser/selectors";
import { cashReward, minimumCashout, rupiah } from "@/lib/browser/glass-value";
import styles from "./dashboard.module.css";
import PaginatedList from "./paginated-list";

const date = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" });

function CashoutList({ entries, isAdmin = false }: { entries: Cashout[]; isAdmin?: boolean }) {
  const [busy, setBusy] = useState("");
  const [feedback, setFeedback] = useState("");

  async function resolve(code: string, decision: "paid" | "rejected" | "cancelled") {
    if (busy) return;
    setBusy(code);
    setFeedback("");
    try {
      const result = await reviewCashout(code, decision);
      if ("error" in result && result.error) setFeedback(result.error);
    } catch {
      setFeedback("Status belum tersimpan. Coba lagi.");
    } finally {
      setBusy("");
    }
  }

  if (!entries.length) return <p className={styles.secondary}>Belum ada pengajuan pencairan.</p>;
  return (
    <>
      <PaginatedList className={styles.activity} label="riwayat pencairan">
        {entries.map((entry) => (
          <li className={styles.cashoutItem} key={entry.code}>
            <div className={styles.cashoutLine}>
              <div className={styles.cashoutCell}>
                <strong>{cashoutStatus[entry.status]}</strong>
                <span>{date.format(new Date(entry.createdAt))}</span>
              </div>
              <div className={styles.cashoutCell}>
                <strong>{rupiah(entry.amount)}</strong>
              </div>
            </div>
            {isAdmin && entry.status === "pending" && <code>{entry.code}</code>}
            {entry.status === "pending" && (
              <div className={styles.detailActions}>
                {isAdmin ? (
                  <>
                    <Button type="button" disabled={Boolean(busy)} onClick={() => resolve(entry.code, "paid")}>Catat pencairan</Button>
                    <Button type="button" variant="outline" disabled={Boolean(busy)} onClick={() => resolve(entry.code, "rejected")}>Tolak</Button>
                  </>
                ) : <Button type="button" variant="outline" disabled={Boolean(busy)} onClick={() => resolve(entry.code, "cancelled")}>Batalkan pengajuan</Button>}
              </div>
            )}
          </li>
        ))}
      </PaginatedList>
      {feedback && <p role="alert" className={styles.feedback}>{feedback}</p>}
    </>
  );
}

function CashoutTotals({ pending, paid }: { pending: number; paid: number }) {
  return (
    <dl className={styles.cashoutTotals}>
      {pending > 0 && <div><dt>Menunggu pencairan</dt><dd>{rupiah(pending)}</dd></div>}
      <div><dt>Sudah dicairkan</dt><dd>{rupiah(paid)}</dd></div>
    </dl>
  );
}

export function ResidentCashout({ balance, paidCash, pendingCash, entries }: {
  balance: number; paidCash: number; pendingCash: number; entries: Cashout[];
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const request = useRef({ id: "", amount: 0 });
  const [confirmationAmount, setConfirmationAmount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = pendingCash > 0;
  const belowMinimum = balance < minimumCashout;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const { id, amount } = request.current;
    setBusy(true);
    setError("");
    try {
      const result = await requestCashout(id, amount);
      if ("code" in result && result.code) dialog.current?.close();
      else setError(result.error ?? "Pencairan belum tersimpan.");
    } catch {
      setError("Pencairan belum tersimpan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${styles.panel} ${styles.cashoutPanel}`} aria-labelledby="cashout-title">
      <div className={styles.cashoutHeading}>
        <h2 id="cashout-title" className={styles.cashoutTitle}><Wallet aria-hidden="true" size={18} /> Saldo tersedia</h2>
        <p className={`${styles.balance} ${styles.cashoutBalance}`}>{rupiah(balance)}</p>
      </div>
      <div className={styles.cashoutAction}>
        {!pending && !belowMinimum && (
          <Button type="button" onClick={() => {
            request.current = { id: createBrowserId(), amount: balance };
            setConfirmationAmount(balance);
            setError("");
            dialog.current?.showModal();
          }}>Cairkan semua</Button>
        )}
        {!pending && belowMinimum && <p className={styles.cashoutNote}>Minimum pencairan {rupiah(minimumCashout)}</p>}
      </div>
      <CashoutTotals pending={pendingCash} paid={paidCash} />
      {entries.length > 0 && <h3 className={`${styles.subheading} ${styles.cashoutTitle}`}><History aria-hidden="true" size={16} /> Riwayat pencairan</h3>}
      <CashoutList entries={entries} />
      <dialog ref={dialog} className={styles.dialog} aria-labelledby="cashout-confirm" onCancel={(event) => { if (busy) event.preventDefault(); }}>
        <h2 id="cashout-confirm">Cairkan saldo</h2>
        <form className={styles.fields} onSubmit={submit}>
          {error && <p role="alert" className={styles.feedback}>{error}</p>}
          <div className={styles.detailActions}>
            <Button type="button" variant="outline" disabled={busy} onClick={() => dialog.current?.close()}>Batal</Button>
            <Button type="submit" disabled={busy}>{busy ? "Mengirim…" : `Cairkan ${rupiah(confirmationAmount)}`}</Button>
          </div>
        </form>
      </dialog>
    </section>
  );
}

export function CashRewardRow({ points, balance, pending }: { points: number; balance: number; pending: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const request = useRef({ id: "", total: 0 });
  const [selection, setSelection] = useState(balance + cashReward.amount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pointsLabel = new Intl.NumberFormat("id-ID").format(cashReward.cost) + " poin";

  async function exchange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const withdraw = submitter?.getAttribute("value") === "withdraw";
    setBusy(true);
    setError("");
    try {
      const result = await redeemCash(request.current.id, withdraw ? request.current.total : undefined);
      if ("success" in result && result.success) dialog.current?.close();
      else setError(result.error ?? "Penukaran belum tersimpan.");
    } catch {
      setError("Penukaran belum tersimpan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className={styles.rewardItem}>
      <div>
        <h3>{rupiah(cashReward.amount)}</h3>
        <p className={styles.secondary}>{pointsLabel}</p>
      </div>
      <Button type="button" variant="outline" aria-label={`Tukar ${rupiah(cashReward.amount)}`} disabled={points < cashReward.cost} onClick={() => {
        request.current = { id: createBrowserId(), total: balance + cashReward.amount };
        setSelection(request.current.total);
        setError("");
        dialog.current?.showModal();
      }}>Tukar</Button>
      <dialog ref={dialog} className={styles.dialog} aria-labelledby="cash-reward-title" onCancel={(event) => { if (busy) event.preventDefault(); }}>
        <h2 id="cash-reward-title">Tukar {pointsLabel}</h2>
        <form className={styles.fields} onSubmit={exchange}>
          <div className={styles.cashRewardChoices}>
            <Button type="submit" disabled={busy} value="save">Simpan {rupiah(cashReward.amount)} di saldo</Button>
            {!pending && <Button type="submit" variant="outline" disabled={busy} value="withdraw">Tukar dan cairkan {rupiah(selection)}</Button>}
          </div>
          {error && <p role="alert" className={styles.feedback}>{error}</p>}
          <Button type="button" variant="outline" disabled={busy} onClick={() => dialog.current?.close()}>Batal</Button>
        </form>
      </dialog>
    </li>
  );
}

export function AdminCashouts({ entries }: { entries: Cashout[] }) {
  const pending = entries.filter(({ status }) => status === "pending");
  const totals = cashoutTotals(entries);
  const history = entries.filter(({ status }) => status !== "pending");
  return (
    <section className={styles.panel} aria-labelledby="admin-cashouts">
      <div className={styles.cashoutHeading}>
        <h2 id="admin-cashouts">Pencairan</h2>
      </div>
      <CashoutTotals {...totals} />
      <CashoutList entries={[...pending, ...history]} isAdmin />
    </section>
  );
}
