import Link from "next/link";
import { Wallet } from "lucide-react";
import styles from "./dashboard.module.css";

export default function BalanceSummary({ title, values, href, linkLabel }: {
  title: string;
  values: ReadonlyArray<readonly [label: string, value: string]>;
  href: string;
  linkLabel: string;
}) {
  return (
    <section className={`${styles.panel} ${styles.balanceSummary}`} aria-labelledby="balance-summary-title">
      <div className={styles.panelHeading}>
        <h2 id="balance-summary-title" className={styles.cashoutTitle}><Wallet aria-hidden="true" size={18} /> {title}</h2>
        <Link href={href} className={`${styles.guideLink} link-reveal`}>{linkLabel}</Link>
      </div>
      <dl className={styles.balanceSummaryValues}>
        {values.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
    </section>
  );
}
