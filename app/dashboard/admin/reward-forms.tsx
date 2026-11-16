"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { addReward, handOverReward, type RewardActionState } from "../reward-actions";
import styles from "../dashboard.module.css";

const empty: RewardActionState = {};

function Feedback({ state }: { state: RewardActionState }) {
  if (state.error) return <p className={styles.feedback} role="alert">{state.error}</p>;
  return <p className={styles.feedback} role="status">{state.message}</p>;
}

export function PublishRewardForm() {
  const request = useRef("");
  const [state, submit, pending] = useActionState(async (_: RewardActionState, form: FormData) => {
    request.current ||= crypto.randomUUID();
    try {
      const result = await addReward(request.current, form);
      if (result.message) request.current = "";
      return result;
    } catch {
      return { error: "Sambungan terputus. Coba simpan lagi." };
    }
  }, empty);

  return (
    <form action={submit} className={styles.fields}>
      <label className={styles.field}>Nama reward<input name="name" required maxLength={100} /></label>
      <div className={styles.formPair}>
        <label className={styles.field}>Biaya poin<input name="cost" type="number" inputMode="numeric" required min={1} max={100000} /></label>
        <label className={styles.field}>Stok<input name="stock" type="number" inputMode="numeric" required min={1} max={10000} /></label>
      </div>
      <label className={styles.field}>Petunjuk pengambilan<input name="pickup" required maxLength={240} /></label>
      <Button type="submit" className={styles.action} disabled={pending}>{pending ? "Menerbitkan…" : "Terbitkan reward"}</Button>
      <Feedback state={state} />
    </form>
  );
}

export function HandOverForm() {
  const [state, submit, pending] = useActionState(async (previous: RewardActionState, form: FormData) => {
    try {
      return await handOverReward(previous, form);
    } catch {
      return { error: "Sambungan terputus. Coba catat lagi." };
    }
  }, empty);

  return (
    <form action={submit} className={styles.fields}>
      <label className={styles.field}>Kode penukaran<input name="code" required maxLength={15} autoComplete="off" spellCheck={false} /></label>
      <Button type="submit" className={styles.action} disabled={pending}>{pending ? "Mencatat…" : "Catat serah terima"}</Button>
      <Feedback state={state} />
    </form>
  );
}
