"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { readResidentRewards } from "@/lib/server/rewards";
import { redeemReward } from "./reward-actions";
import styles from "./dashboard.module.css";

export type ResidentRewardData = Awaited<ReturnType<typeof readResidentRewards>>;

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
    request.current = crypto.randomUUID();
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
      <section className={styles.panel} aria-labelledby="points-balance">
        <h2 id="points-balance">Saldo poin</h2>
        <p className={styles.balance}>{format.format(data.balance)} <small>poin</small></p>
        <p className={styles.secondary}>Setiap botol yang diterima petugas menambah 1 poin.</p>
        <h3 className={styles.subheading}>Riwayat poin terbaru</h3>
        {data.activity.length ? (
          <ul className={styles.activity}>
            {data.activity.map((item) => (
              <li key={item.code} className={styles.row}>
                <span><strong>{item.description}</strong>{item.date && <small>{dateFormat.format(new Date(item.date))}</small>}</span>
                <span>{item.points > 0 ? "+" : "−"}{format.format(Math.abs(item.points))}</span>
              </li>
            ))}
          </ul>
        ) : <p className={styles.secondary}>Belum ada transaksi poin.</p>}
      </section>

      <section className={styles.panel} aria-labelledby="rewards-title">
        <h2 id="rewards-title">Katalog reward</h2>
        {data.rewards.length ? (
          <ul className={styles.activity}>
            {data.rewards.map((reward) => (
              <li key={reward.id} className={styles.rewardItem}>
                <div>
                  <h3>{reward.name}</h3>
                  <p className={styles.secondary}>{format.format(reward.cost)} poin · {reward.stock ? `Stok ${format.format(reward.stock)}` : "Stok habis"}</p>
                </div>
                <Button type="button" variant="outline" disabled={!reward.stock || data.balance < reward.cost} onClick={() => open(reward)}>
                  {reward.stock && data.balance < reward.cost ? "Poin belum cukup" : "Tukar"}
                </Button>
              </li>
            ))}
          </ul>
        ) : <p className={styles.secondary}>Belum ada reward yang tersedia.</p>}

        <h3 className={styles.subheading}>Penukaran terbaru</h3>
        {data.redemptions.length ? (
          <ul className={styles.activity}>
            {data.redemptions.map((item) => (
              <li key={item.code} className={styles.rewardItem}>
                <div>
                  <h4>{item.name}</h4>
                  <p className={styles.secondary}>{item.fulfilled ? "Sudah diserahkan" : item.pickup}</p>
                  <code>{item.code}</code>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className={styles.secondary}>Belum ada penukaran.</p>}
      </section>

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
