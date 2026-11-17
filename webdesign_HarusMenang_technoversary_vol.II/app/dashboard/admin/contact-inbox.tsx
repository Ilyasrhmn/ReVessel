import type { ContactMessage } from "@/lib/browser/data";
import styles from "../dashboard.module.css";

const date = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" });

export default function ContactInbox({ messages }: { messages: ContactMessage[] }) {
  return (
    <section className={styles.panel} aria-labelledby="inbox-title">
      <h2 id="inbox-title">Pesan terbaru</h2>
      {messages.length ? (
        <ul className={styles.history}>
          {messages.map((message) => (
            <li key={message.id}>
              <details name="contact-messages">
                <summary className={styles.row}>
                  <span><strong>{message.name}</strong><small>{date.format(new Date(message.sentAt))}</small></span>
                  <span className={styles.expand} aria-hidden="true" />
                </summary>
                <div className={styles.detail}>
                  {message.subject && <strong>{message.subject}</strong>}
                  <p className={styles.contactMessage}>{message.body}</p>
                  <a href={`mailto:${encodeURIComponent(message.email).replace("%40", "@")}`} className="link-reveal">
                    <span>Balas lewat email</span>
                  </a>
                </div>
              </details>
            </li>
          ))}
        </ul>
      ) : <p className={styles.secondary}>Belum ada pesan masuk.</p>}
    </section>
  );
}
