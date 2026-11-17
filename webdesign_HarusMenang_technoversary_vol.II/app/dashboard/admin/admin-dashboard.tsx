"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Boxes, ClipboardCheck, FileCheck, Gift, Mail, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { adminDepositBuckets, adminDeposits, dashboardResidents, pendingRedemptions, rewardCatalog } from "@/lib/browser/selectors";
import type { BrowserState, Mode, Workspace } from "@/lib/browser/data";
import BrowserGate from "../browser-gate";
import DashboardShell from "../dashboard-shell";
import DepositReview from "../deposit-review";
import { depositWeightLabel, statusLabels } from "../deposit-store";
import styles from "../dashboard.module.css";
import DepositAnalytics from "../deposit-analytics";
import { HandOverForm, PublishRewardForm } from "./reward-forms";
import ContactInbox from "./contact-inbox";

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

export default function AdminDashboard() {
  const query = useSearchParams();
  return (
    <BrowserGate role="admin" loginHref="/masuk">
      {(state, user) => <AdminWorkspace query={query} state={state} mode={user.mode} name={user.name} />}
    </BrowserGate>
  );
}

function AdminWorkspace({ query, state, mode, name }: { query: Pick<URLSearchParams, "get">; state: BrowserState; mode: Mode; name: string }) {
  const workspace = state.workspaces[mode];
  const tab = tabs.find((item) => item.id === query.get("bagian")) ?? (query.get("status") || query.get("kode") ? tabs[1] : tabs[0]);
  const filter = filters.find((item) => item === query.get("status")) ?? "semua";
  const requestedCode = query.get("kode");
  const code = requestedCode && /^RV-[A-F0-9]{8}$/.test(requestedCode) ? requestedCode : null;
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
      profile={{ name, role: "Admin" }}
      items={items}
      shortcuts={items.filter(({ id }) => id !== "reward")}
      activity={{ href: `${depositsHref}&status=pending_approval`, label: "Lihat pengajuan yang menunggu persetujuan" }}
      primaryAction={<Link href={`${depositsHref}#pemeriksaan`}><Search aria-hidden="true" /> Cari kode</Link>}
    >
      {tab.id === "ringkasan" ? <AdminOverview workspace={workspace} /> : tab.id === "pengguna" ? <AdminResidents data={dashboardResidents(state, mode)} />
        : tab.id === "reward" ? <AdminRewards workspace={workspace} /> : tab.id === "pesan" ? <ContactInbox messages={workspace.messages.slice(0, 25)} />
        : <AdminDeposits workspace={workspace} filter={filter} code={code} />}
    </DashboardShell>
  );
}

function AdminOverview({ workspace }: { workspace: Workspace }) {
  const buckets = adminDepositBuckets(workspace);
  const entries = adminDeposits(workspace, null, 5);
  return (
    <>
      <DepositAnalytics buckets={buckets} />
      <div className={styles.columns}>
        <AdminDepositList entries={entries} filter="semua" overview />
        <DepositReview workspace={workspace} compact />
      </div>
    </>
  );
}

function AdminDeposits({ workspace, filter, code }: { workspace: Workspace; filter: (typeof filters)[number]; code: string | null }) {
  const entries = adminDeposits(workspace, filter === "semua" ? null : filter, 25);
  return (
    <div className={styles.columns}>
      <AdminDepositList entries={entries} filter={filter} />
      <DepositReview key={code} initialCode={code} workspace={workspace} compact />
    </div>
  );
}

function AdminDepositList({ entries, filter, overview }: {
  entries: ReturnType<typeof adminDeposits>;
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
              <details name="admin-deposits">
                <summary className={`${styles.row} ${styles.depositRow}`}>
                  <span><strong>{entry.material}</strong><small>{entry.code}</small></span>
                  <div className={styles.rowEnd}>
                    <span className={styles.depositWeight}>{depositWeightLabel(entry)}</span>
                    <Badge className={styles.status} variant="secondary" data-state={entry.status}>{statusLabels[entry.status]}</Badge>
                    <span className={styles.expand} aria-hidden="true" />
                  </div>
                </summary>
                <div className={styles.detail}>
                  <p>{entry.pointName} · {date.format(new Date(entry.createdAt))}</p>
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

function AdminResidents({ data: { total, entries } }: { data: ReturnType<typeof dashboardResidents> }) {
  return (
    <section className={styles.panel} aria-labelledby="residents-title">
      <h2 id="residents-title">Pengguna terbaru <span className={styles.secondary}>· {number.format(total)} terdaftar</span></h2>
      {entries.length ? (
        <ul className={styles.activity}>
          {entries.map((entry) => (
            <li className={styles.row} key={entry.id}><strong>{entry.name}</strong><span>{date.format(new Date(entry.createdAt))}</span></li>
          ))}
        </ul>
      ) : <p className={styles.secondary}>Belum ada warga yang terdaftar.</p>}
    </section>
  );
}

function AdminRewards({ workspace }: { workspace: Workspace }) {
  const rewards = rewardCatalog(workspace);
  const pending = pendingRedemptions(workspace);
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
