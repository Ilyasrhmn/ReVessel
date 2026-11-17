"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Pencil, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { attachDepositPhoto } from "@/lib/browser/deposits";
import { depositPhotoError } from "@/lib/browser/deposit-photo";
import styles from "./dashboard.module.css";

export function DepositPhoto({ src, preview = false }: { src: string; preview?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={styles.photoThumbnail} aria-label="Perbesar foto setoran" aria-haspopup="dialog" onClick={() => { setOpen(true); dialog.current?.showModal(); }}>
        <Image src={src} width={96} height={96} unoptimized alt={preview ? "Pratinjau foto setoran" : "Foto kaca yang diajukan"} />
      </button>
      <dialog ref={dialog} className={`${styles.dialog} ${styles.photoDialog}`} aria-labelledby={title} onClose={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
        {open && (
          <>
            <h2 id={title}>Foto setoran</h2>
            <button type="button" className={styles.close} aria-label="Tutup foto" onClick={() => dialog.current?.close()}><X aria-hidden="true" /></button>
            <Image className={styles.depositPhoto} src={src} width={840} height={630} unoptimized alt="Foto setoran diperbesar" />
          </>
        )}
      </dialog>
    </>
  );
}

export function DepositPhotoField({ disabled }: { disabled: boolean }) {
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (preview) return () => URL.revokeObjectURL(preview);
  }, [preview]);

  return (
    <div className={styles.field}>
      <label htmlFor={id}>Foto setoran</label>
      <input
        id={id}
        ref={inputRef}
        className="sr-only"
        tabIndex={-1}
        name="photo"
        type="file"
        accept="image/*"
        capture="environment"
        required
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? id + "-error" : undefined}
        onChange={({ currentTarget: input }) => {
          const file = input.files?.[0] ?? null;
          const message = file ? depositPhotoError(file) : "";
          input.setCustomValidity(message);
          setError(message);
          setPreview(file && !message ? URL.createObjectURL(file) : "");
        }}
      />
      <Button type="button" variant="outline" className={styles.photoChoose} disabled={disabled} onClick={() => inputRef.current?.click()}>
        <Upload aria-hidden="true" />{preview ? "Ganti foto" : "Pilih foto"}
      </Button>
      {error && <p id={id + "-error"} role="alert" className={styles.feedback}>{error}</p>}
      {preview && (
        <div className={styles.photoPreview}>
          <DepositPhoto key={preview} src={preview} preview />
          <button type="button" className={styles.removePhoto} disabled={disabled} aria-label="Hapus foto" onClick={() => {
            const input = inputRef.current;
            if (input) { input.value = ""; input.setCustomValidity(""); }
            setPreview("");
            setError("");
          }}><X aria-hidden="true" /></button>
        </div>
      )}
    </div>
  );
}

export function PendingDepositPhoto({ code, hasPhoto = false }: { code: string; hasPhoto?: boolean }) {
  const [editing, setEditing] = useState(!hasPhoto);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const result = await attachDepositPhoto(code, form);
      if (result.error) setError(result.error);
      else setEditing(false);
    } catch {
      setError("Foto belum tersimpan. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  if (!editing) return (
    <Button type="button" variant="outline" className={styles.photoChoose} onClick={() => setEditing(true)}><Pencil aria-hidden="true" />Edit foto</Button>
  );

  return (
    <form className={`${styles.fields} ${styles.photoForm}`} onSubmit={submit}>
      <DepositPhotoField disabled={pending} />
      {error && <p role="alert" className={styles.feedback}>{error}</p>}
      <div className={styles.detailActions}>
        <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan foto"}</Button>
        {hasPhoto && <Button type="button" variant="outline" disabled={pending} onClick={() => { setEditing(false); setError(""); }}>Batal edit</Button>}
      </div>
    </form>
  );
}
