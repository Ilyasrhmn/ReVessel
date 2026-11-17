"use client";

import { createBrowserId } from "@/lib/browser/id";
import { useRef, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendContactMessage } from "@/lib/browser/contact";
import styles from "./contact.module.css";

export default function ContactForm() {
  const request = useRef("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ error?: string; success?: boolean }>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    request.current ||= createBrowserId();
    setFeedback({});
    setPending(true);
    try {
      const result = await sendContactMessage(request.current, new FormData(form));
      setFeedback(result);
      if (result.success) {
        form.reset();
        request.current = "";
      }
    } catch {
      setFeedback({ error: "Pesan gagal disimpan. Coba lagi." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label>Nama<input name="name" required maxLength={80} autoComplete="name" /></label>
      <label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
      <label>Pesan<textarea name="message" required minLength={10} maxLength={2000} rows={5} /></label>
      <label hidden>Situs web<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <Button type="submit" disabled={pending}><Send aria-hidden="true" />{pending ? "Mengirim…" : "Kirim pesan"}</Button>
      {feedback.error && <p role="alert">{feedback.error}</p>}
      {feedback.success && <p role="status">Pesan tersimpan di kotak masuk demo pada browser ini.</p>}
    </form>
  );
}
