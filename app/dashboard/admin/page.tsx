import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Boxes, ClipboardCheck, FileCheck, Gift, Mail, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { readAdminDepositBuckets, readAdminDeposits, readAdminResidents } from "@/lib/server/admin";
import { lookupAssignedDeposit } from "@/lib/server/deposits";
import { currentUser } from "@/lib/server/auth";
import { readPendingRedemptions, readRewards } from "@/lib/server/rewards";
import DashboardShell from "../dashboard-shell";
import DepositReview from "../deposit-review";
import { statusLabels } from "../deposit-store";
import styles from "../dashboard.module.css";
import AdminAnalytics from "./admin-analytics";
import { HandOverForm, PublishRewardForm } from "./reward-forms";
import ContactInbox from "./contact-inbox";

export const metadata: Metadata = { title: "Dashboard admin | ReVessel" };

const tabs = [
  { id: "ringkasan", label: "Ringkasan", title: "Ringkasan setoran", icon: Boxes },
  { id: "setoran", label: "Setoran masuk", title: "Setoran masuk", icon: ClipboardCheck },
  { id: "pengguna", label: "Pengguna", title: "Pengguna", icon: Users },
  { id: "reward", label: "Reward", title: "Reward", icon: Gift },
  { id: "pesan", label: "Pesan masuk", title: "Pesan masuk", icon: Mail },
] as const;
const filters = ["semua", "pending_approval", "approved", "waiting", "accepted", "adjustment", "rejected", "cancelled"] as const;
const base = "/dashboard/admin";
const depositsHref = `${base}?bagian=setoran`;
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
  const tab = tabs.find((item) => item.id === query.bagian) ?? (query.status || query.kode ? tabs[1] : tabs[0]);
  const filter = filters.find((item) => item === query.status) ?? "semua";
  const code = typeof query.kode === "string" && /^RV-[A-F0-9]{8}$/.test(query.kode) ? query.kode : null;
  const items = tabs.map(({ id, label, icon: Icon }) => ({
    id,
    label,
    href: id === "ringkasan" ? base : `${base}?bagian=${id}`,
    icon: <Icon aria-hidden="true" />,
  }));

  return (
    <DashboardShell
      view={tab.id}
      title={tab.title}
      homeHref={base}
      profile={{ name: user.name, role: "Admin" }}
      items={items}
      shortcuts={items.filter(({ id }) => id !== "reward")}
      activity={{ href: `${depositsHref}&status=pending_approval`, label: "Lihat pengajuan yang menunggu persetujuan" }}
      primaryAction={<Link href={`${depositsHref}#pemeriksaan`}><Search aria-hidden="true" /> Cari kode</Link>}
    >
      {tab.id === "ringkasan" ? <AdminOverview /> : tab.id === "pengguna" ? <AdminResidents />
        : tab.id === "reward" ? <AdminRewards /> : tab.id === "pesan" ? <ContactInbox />
        : <AdminDeposits filter={filter} code={code} userId={user.id} />}
    </DashboardShell>
  );
}

async function AdminOverview() {
  const [buckets, { entries }] = await Promise.all([
    readAdminDepositBuckets(),
    readAdminDeposits(null, 5),
  ]);
  return (
    <>
      <AdminAnalytics buckets={buckets} />
      <div className={styles.columns}>
        <AdminDepositList entries={entries} filter="semua" overview />
        <DepositReview compact />
      </div>
    </>
  );
}

async function AdminDeposits({ filter, code, userId }: { filter: (typeof filters)[number]; code: string | null; userId: string }) {
  const [{ entries }, initial] = await Promise.all([
    readAdminDeposits(filter === "semua" ? null : filter, 25),
    code ? lookupAssignedDeposit(userId, code, true) : null,
  ]);
  return (
    <div className={styles.columns}>
      <AdminDepositList entries={entries} filter={filter} />
      <DepositReview key={code} initial={initial} compact />
    </div>
  );
}

function AdminDepositList({ entries, filter, overview }: {
  entries: Awaited<ReturnType<typeof readAdminDeposits>>["entries"];
  filter: (typeof filters)[number];
  overview?: boolean;
}) {
  return (
    <Card role="region" className={styles.panel} aria-labelledby="incoming-title">
      <div className={styles.panelHeading}>
        <h2 id="incoming-title">Setoran terbaru</h2>
        {overview && (
          <Link href={depositsHref} className={`${styles.guideLink} link-reveal`}>
            <ClipboardCheck aria-hidden="true" /><span>Semua setoran</span>
          </Link>
        )}
      </div>
      {!overview && (
        <nav className={styles.statusFilter} aria-label="Filter status setoran">
          {filters.map((status) => (
            <Link key={status} href={status === "semua" ? depositsHref : `${depositsHref}&status=${status}`} aria-current={filter === status ? "true" : undefined}>
              {status === "semua" ? "Semua" : statusLabels[status]}
            </Link>
          ))}
        </nav>
      )}
      {entries.length ? (
        <ul className={styles.history}>
          {entries.map((entry) => (
            <li key={entry.code}>
              <details>
                <summary className={styles.row}>
                  <span><strong>{entry.code}</strong><small>{entry.material} · {number.format(entry.quantity)} wadah</small></span>
                  <div className={styles.rowEnd}>
                    <Badge className={styles.status} variant="secondary" data-state={entry.status}>{statusLabels[entry.status]}</Badge>
                    <span className={styles.expand} aria-hidden="true" />
                  </div>
                </summary>
                <div className={styles.detail}>
                  <p>{entry.pointName} · {date.format(entry.date)}</p>
                  {(entry.status === "waiting" || entry.status === "pending_approval") && (
                    <Link href={`${depositsHref}&status=${filter}&kode=${entry.code}#pemeriksaan`} className={`${styles.guideLink} link-reveal`} aria-label={`Periksa ${entry.code}`}>
                      <FileCheck aria-hidden="true" /><span>Periksa</span>
                    </Link>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ul>
      ) : <div className={styles.empty}><h3>{filter === "semua" ? "Belum ada setoran" : "Belum ada setoran dengan status ini"}</h3></div>}
    </Card>
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
