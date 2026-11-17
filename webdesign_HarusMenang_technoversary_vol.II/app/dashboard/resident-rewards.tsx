"use client";

import { createBrowserId } from "@/lib/browser/id";
import { useRef, useState, type FormEvent } from "react";
import { Gift, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { residentRewards } from "@/lib/browser/selectors";
import { redeemReward } from "@/lib/browser/rewards";
import styles from "./dashboard.module.css";
import { CashRewardRow, ResidentCashout } from "./cashout-panels";
import { formatGrams, gramsPerPoint } from "@/lib/browser/glass-value";

export type ResidentRewardData = Awaited<ReturnType<typeof residentRewards>>;

const format = new Intl.NumberFormat("id-ID");
const dateFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" });

export default function ResidentRewards({ data }: { data: ResidentRewardData }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const request = useRef("");
  const [selected, setSelected] = useState<ResidentRewardData["rewards"][number] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState("");

  function open(reward: NonNullable<typeof selected>) {
    request.current = createBrowserId();
    setSelected(reward);
    setError("");
    setReceipt("");
    dialog.current?.showModal();
  }

  async function redeem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || busy || receipt) return;
    setBusy(true);
    setError("");
    try {
      const result = await redeemReward(selected.id, request.current);
      if (result.code) setReceipt(result.code);
      else setError(result.error ?? "Penukaran belum selesai. Coba lagi.");
    } catch {
      setError("Penukaran belum bisa dikonfirmasi. Coba lagi untuk memeriksa hasilnya.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.guideGrid}>
      <ResidentCashout balance={data.cashBalance} paidCash={data.paidCash} pendingCash={data.pendingCash} entries={data.cashouts} />

      <section className={styles.panel} aria-labelledby="points-balance">
        <h2 id="points-balance">Saldo poin</h2>
        <p className={styles.balance}>{format.format(data.balance)} <small>poin</small></p>
        <p className={styles.secondary}>Setoran baru menghasilkan 1 poin per {gramsPerPoint} gram kaca yang diterima.</p>
        <h3 className={styles.subheading}>Riwayat poin terbaru</h3>
        {data.activity.length ? (
          <ul className={styles.activity}>
            {data.activity.map((item) => (
              <li key={item.code} className={styles.cashoutItem}>
                <div className={styles.cashoutLine}>
                  <div className={styles.cashoutCell}>
                    <strong>{item.description}</strong>
                    <span>{dateFormat.format(new Date(item.date))}</span>
                  </div>
                  <div className={styles.cashoutCell}>
                    <strong>{item.points > 0 ? "+" : item.points < 0 ? "−" : ""}{format.format(Math.abs(item.points))} poin</strong>
                    {"weightGrams" in item && typeof item.weightGrams === "number" && <span>{formatGrams(item.weightGrams)}</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className={styles.secondary}>Belum ada transaksi poin.</p>}
      </section>

      <div className={styles.rewardColumn}>
        <section className={styles.panel} aria-labelledby="rewards-title">
          <h2 id="rewards-title" className={styles.cashoutTitle}><Gift aria-hidden="true" size={18} /> Tukar poin</h2>
          <ul className={styles.activity}>
            <CashRewardRow points={data.balance} balance={data.cashBalance} pending={data.pendingCash > 0} />
            {data.rewards.map((reward) => (
              <li key={reward.id} className={styles.rewardItem}>
                <div className={styles.cashoutCell}>
                  <h3>{reward.name}</h3>
                  <span>{format.format(reward.cost)} poin</span>
                </div>
                <Button type="button" variant="outline" disabled={!reward.stock || data.balance < reward.cost} onClick={() => open(reward)}>
                  {!reward.stock ? "Stok habis" : data.balance < reward.cost ? "Poin belum cukup" : "Tukar"}
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.panel} aria-labelledby="redemption-history">
          <h2 id="redemption-history" className={styles.cashoutTitle}><History aria-hidden="true" size={18} /> Penukaran terbaru</h2>
          {data.redemptions.length ? (
            <ul className={styles.activity}>
              {data.redemptions.map((item) => (
                <li key={item.code} className={styles.cashoutItem}>
                  <div className={styles.cashoutLine}>
                    <div className={styles.cashoutCell}>
                      <strong>{item.kind === "cash" ? "Saldo rupiah" : item.name}</strong>
                      <span>{dateFormat.format(new Date(item.createdAt))}</span>
                      {item.kind === "item" && !item.fulfilled && <code>{item.code}</code>}
                    </div>
                    <div className={styles.cashoutCell}>
                      <strong>{item.kind === "cash" ? item.name : format.format(item.cost) + " poin"}</strong>
                      <span>{item.kind === "cash" ? format.format(item.cost) + " poin" : item.fulfilled ? "Sudah diambil" : "Menunggu diambil"}</span>
                    </div>
                  </div>
                  {item.kind === "item" && !item.fulfilled && <p className={styles.cashoutNote}>{item.pickup}</p>}
                </li>
              ))}
            </ul>
          ) : <p className={styles.secondary}>Belum ada penukaran.</p>}
        </section>
      </div>

      <dialog ref={dialog} className={styles.dialog} aria-labelledby="redeem-title" onCancel={(event) => { if (busy) event.preventDefault(); }}>
        <h2 id="redeem-title">{receipt ? "Penukaran berhasil" : "Tukar poin?"}</h2>
        {selected && (
          <form className={styles.fields} onSubmit={redeem}>
            {receipt ? (
              <>
                <output className={styles.code}>{receipt}</output>
                <p>{selected.pickup}</p>
                <Button type="button" onClick={() => dialog.current?.close()}>Selesai</Button>
              </>
            ) : (
              <>
                <p>Tukar {format.format(selected.cost)} poin untuk {selected.name}.</p>
                <p className={styles.secondary}>{selected.pickup}</p>
                {error && <p role="alert" className={styles.feedback}>{error}</p>}
                <div className={styles.detailActions}>
                  <Button type="button" variant="outline" disabled={busy} onClick={() => dialog.current?.close()}>Batal</Button>
                  <Button type="submit" disabled={busy}>{busy ? "Menukar poin…" : "Konfirmasi tukar"}</Button>
                </div>
              </>
            )}
          </form>
        )}
      </dialog>
    </div>
  );
}
