import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FileCheck, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { readAdminDeposits, readAdminResidents } from "@/lib/server/admin";
import { lookupAssignedDeposit } from "@/lib/server/deposits";
import { currentUser } from "@/lib/server/auth";
import { readPendingRedemptions, readRewards } from "@/lib/server/rewards";
import { logout } from "../../session-actions";
import { BrandSymbol } from "../../ui/brand-logo";
import NavBubble from "../../ui/nav-bubble";
import SessionSubmit from "../../ui/session-submit";
import DepositReview from "../deposit-review";
import { statusLabels } from "../deposit-store";
import styles from "../dashboard.module.css";
import { HandOverForm, PublishRewardForm } from "./reward-forms";
import ContactInbox from "./contact-inbox";

export const metadata: Metadata = { title: "Dashboard admin | ReVessel" };

const tabs = [
  { id: "setoran", label: "Setoran masuk" },
  { id: "pengguna", label: "Pengguna" },
  { id: "reward", label: "Reward" },
  { id: "pesan", label: "Pesan masuk" },
] as const;
const filters = ["semua", "pending_approval", "approved", "waiting", "accepted", "adjustment", "rejected", "cancelled"] as const;
const base = "/dashboard/admin";
const number = new Intl.NumberFormat("id-ID");
const date = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" });

export default function AdminPage(props: PageProps<"/dashboard/admin">) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted" role="status">Memuat dashboard…</p>}>
      <AuthorizedAdmin searchParams={props.searchParams} />
    </Suspense>
  );
}

async function AuthorizedAdmin({ searchParams }: Pick<PageProps<"/dashboard/admin">, "searchParams">) {
  const user = await currentUser();
  if (!user) redirect("/masuk");
  if (user.role !== "admin") redirect("/dashboard");

  const query = await searchParams;
  const tab = tabs.find((item) => item.id === query.bagian) ?? tabs[0];
  const filter = filters.find((item) => item === query.status) ?? "semua";
  const code = typeof query.kode === "string" && /^RV-[A-F0-9]{8}$/.test(query.kode) ? query.kode : null;

  return (
    <div className={`${styles.dashboard} ${styles.admin}`}>
      <a href="#main" className={styles.skipLink}>Langsung ke konten</a>
      <header className={styles.topbar}>
        <Link href={base} className={styles.brand} aria-label="Dashboard admin ReVessel">
          <span className={styles.brandMark}><BrandSymbol /></span>ReVessel
        </Link>
        <nav className={styles.topNav} aria-label="Navigasi admin">
          <NavBubble active={tab.id} />
          {tabs.map((item) => (
            <Link key={item.id} href={item.id === "setoran" ? base : `${base}?bagian=${item.id}`} data-nav-item={item.id} aria-current={tab.id === item.id ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className={styles.headerTools}>
          <SessionSubmit idle="Keluar" pending="Sedang keluar…" icon={<LogOut aria-hidden="true" />} />
        </form>
      </header>
      <main id="main" className={styles.main} tabIndex={-1}>
        <header className={styles.header}>
          <h1>{tab.label}</h1>
          <Badge className={styles.roleBadge} variant="outline">Admin</Badge>
        </header>
        <div key={tab.id} className={styles.appear}>
          {tab.id === "pengguna" ? <AdminResidents /> : tab.id === "reward" ? <AdminRewards /> : tab.id === "pesan" ? <ContactInbox /> : <AdminDeposits filter={filter} code={code} userId={user.id} />}
        </div>
      </main>
    </div>
  );
}

async function AdminDeposits({ filter, code, userId }: { filter: (typeof filters)[number]; code: string | null; userId: string }) {
  const [{ summary, entries }, initial] = await Promise.all([
    readAdminDeposits(filter === "semua" ? null : filter),
    code ? lookupAssignedDeposit(userId, code, true) : null,
  ]);
  const stats = [
    ["Menunggu persetujuan", summary.pending],
    ["Menunggu serah terima", summary.waiting],
    ["Setoran diterima", summary.accepted],
    ["Botol diterima", summary.units],
  ] as const;

  return (
    <div className={styles.adminStack}>
      <dl className={styles.adminStats}>
        {stats.map(([label, value]) => (
          <div key={label} className={styles.panel}>
            <dt>{label}</dt>
            <dd>{number.format(value)}</dd>
          </div>
        ))}
      </dl>

      <section className={styles.panel} aria-labelledby="incoming-title">
        <div className={styles.panelHeading}>
          <h2 id="incoming-title">Setoran terbaru</h2>
          <nav className={styles.statusFilter} aria-label="Filter status setoran">
            {filters.map((status) => (
              <Link key={status} href={status === "semua" ? base : `${base}?status=${status}`} aria-current={filter === status ? "true" : undefined}>
                {status === "semua" ? "Semua" : statusLabels[status]}
              </Link>
            ))}
          </nav>
        </div>
        {entries.length ? (
          <ul className={styles.activity}>
            {entries.map((entry) => (
              <li className={styles.row} key={entry.code}>
                <span><strong>{entry.code}</strong><small>{entry.pointName} · {date.format(entry.date)}</small></span>
                <span>{entry.material} · {number.format(entry.quantity)} botol</span>
                <div className={styles.rowEnd}>
                  <Badge className={styles.status} variant="secondary" data-state={entry.status}>{statusLabels[entry.status]}</Badge>
                  {(entry.status === "waiting" || entry.status === "pending_approval") && (
                    <Link href={`${base}?status=${filter}&kode=${entry.code}#pemeriksaan`} className={`${styles.guideLink} link-reveal`} aria-label={`Periksa ${entry.code}`}>
                      <FileCheck aria-hidden="true" /><span>Periksa</span>
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : <p className={styles.secondary}>Belum ada setoran dengan filter ini.</p>}
      </section>
      <DepositReview key={code} initial={initial} />
    </div>
  );
}

async function AdminResidents() {
  const { total, entries } = await readAdminResidents();
  return (
    <section className={styles.panel} aria-labelledby="residents-title">
      <h2 id="residents-title">Pengguna terbaru <span className={styles.secondary}>· {number.format(total)} terdaftar</span></h2>
      {entries.length ? (
        <ul className={styles.activity}>
          {entries.map((entry) => (
            <li className={styles.row} key={entry.id}><strong>{entry.name}</strong><span>{date.format(entry.date)}</span></li>
          ))}
        </ul>
      ) : <p className={styles.secondary}>Belum ada warga yang terdaftar.</p>}
    </section>
  );
}

async function AdminRewards() {
  const [rewards, pending] = await Promise.all([readRewards(), readPendingRedemptions()]);
  return (
    <div className={styles.guideGrid}>
      <section className={styles.panel} aria-labelledby="manage-rewards">
        <h2 id="manage-rewards">Katalog reward</h2>
        {rewards.length ? (
          <ul className={styles.activity}>
            {rewards.map((reward) => (
              <li key={reward.id} className={styles.row}>
                <strong>{reward.name}</strong>
                <span>{number.format(reward.cost)} poin · Stok {number.format(reward.stock)}</span>
              </li>
            ))}
          </ul>
        ) : <p className={styles.secondary}>Katalog masih kosong.</p>}
        <h3 className={styles.subheading}>Tambah reward</h3>
        <PublishRewardForm />
      </section>
      <section className={styles.panel} aria-labelledby="pending-rewards">
        <h2 id="pending-rewards">Menunggu diambil</h2>
        {pending.length ? (
          <ul className={styles.activity}>
            {pending.map((reward) => (
              <li key={reward.code} className={styles.row}><strong>{reward.name}</strong><code>…{reward.code.slice(-4)}</code></li>
            ))}
          </ul>
        ) : <p className={styles.secondary}>Belum ada reward yang perlu diserahkan.</p>}
        <h3 className={styles.subheading}>Verifikasi pengambilan</h3>
        <HandOverForm />
      </section>
    </div>
  );
}
