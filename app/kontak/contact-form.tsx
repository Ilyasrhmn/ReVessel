"use client";

import { useRef, useState, type FormEvent } from "react";
import Icon from "../ui/interface-icon";
import styles from "../pages.module.css";

export default function ContactForm() {
  const [preview, setPreview] = useState<{
    name: string;
    email: string;
    message: string;
  } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [error, setError] = useState("");

  function showPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      message: String(data.get("message") || "").trim(),
    };
    if (next.name.length < 2 || next.message.length < 10) {
      setError(
        "Isi nama minimal 2 karakter dan pesan minimal 10 karakter selain spasi.",
      );
      setPreview(null);
      return;
    }
    setError("");
    setPreview(next);
    requestAnimationFrame(() => heading.current?.focus());
  }

  return (
    <div>
      <form className={styles.contactForm} onSubmit={showPreview}>
        <label>
          Nama
          <input
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
          />
        </label>
        <label>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </label>
        <label>
          Pesan
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={2000}
            rows={5}
          />
        </label>
        <button type="submit" className={styles.submit}>
          Pratinjau pesan
          <Icon />
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
      {preview && (
        <section
          className={styles.messagePreview}
          aria-labelledby="message-preview-title"
        >
          <h2 ref={heading} tabIndex={-1} id="message-preview-title">
            Pratinjau, belum dikirim
          </h2>
          <p>
            {preview.name} · {preview.email}
          </p>
          <p className={styles.messageText}>{preview.message}</p>
        </section>
      )}
    </div>
  );
}
