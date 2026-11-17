"use client";

import { useId, useMemo, useSyncExternalStore } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { useDashboardPreferences } from "@/lib/browser/preferences";
import type { DashboardPreferences } from "@/lib/browser/data";
import { analyticsPeriods, materials, type AnalyticsPeriod } from "../deposit-options";
import NavBubble from "../ui/nav-bubble";
import { statusLabels, type Deposit } from "./deposit-store";
import styles from "./dashboard.module.css";

type MaterialFilter = DashboardPreferences["material"];
const materialLabels: Record<MaterialFilter, string> = {
  all: "Semua", "Botol parfum": "Parfum", "Botol kosmetik": "Kosmetik", "Jar kaca": "Jar kaca",
  "Botol sirup": "Sirup", "Botol minuman": "Minuman",
};
const number = new Intl.NumberFormat("id-ID");
const date = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" });
const day = 86_400_000;
const jakartaOffset = 7 * 3_600_000;

function currentDay() {
  return Math.floor((Date.now() + jakartaOffset) / day) * day - jakartaOffset;
}

function subscribeToDay(onChange: () => void) {
  const interval = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(interval);
}

const unknownDay = () => 0;
const motionQuery = "(prefers-reduced-motion: no-preference)";
const motionAllowed = () => window.matchMedia(motionQuery).matches;
const motionOff = () => false;

function subscribeToMotion(onChange: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export type DepositBucket = Pick<Deposit, "createdAt" | "material" | "quantity" | "status"> & { count: number };
type AnalyticsRow = Deposit | DepositBucket;

function counts(deposits: AnalyticsRow[]) {
  const totals = { total: 0, waiting: 0, pendingApproval: 0, handover: 0, accepted: 0, adjustment: 0, containers: 0 };
  for (const item of deposits) {
    const count = "count" in item ? item.count : 1;
    totals.total += count;
    if (item.status === "pending_approval" || item.status === "approved" || item.status === "waiting") totals.waiting += count;
    if (item.status === "pending_approval") totals.pendingApproval += count;
    if (item.status === "waiting") totals.handover += count;
    if (item.status === "adjustment") totals.adjustment += count;
    if (item.status === "accepted") {
      totals.accepted += count;
      totals.containers += item.quantity;
    }
  }
  return totals;
}

const residentMetrics = [
  ["total", "Setoran"],
  ["waiting", "Dalam proses"],
  ["accepted", "Diterima"],
  ["adjustment", "Perlu penyesuaian"],
  ["containers", "Wadah diterima"],
] as const;

const adminMetrics = [
  ["total", "Setoran"],
  ["pendingApproval", "Menunggu persetujuan"],
  ["handover", "Menunggu serah terima"],
  ["accepted", "Diterima"],
  ["containers", "Wadah diterima"],
] as const;

const chartConfig = {
  total: { label: "Periode ini", color: "var(--ui-primary)" },
  previous: { label: "Periode lalu", color: "var(--ui-muted-foreground)" },
} satisfies ChartConfig;

function getPeriodData(deposits: AnalyticsRow[], period: AnalyticsPeriod, material: MaterialFilter, today: number) {
  const end = today + day;
  const start = end - period * day;
  const prior = start - period * day;
  const relevant = today ? deposits.filter((deposit) => material === "all" || deposit.material === material) : [];
  const current = relevant.filter(({ createdAt }) => Date.parse(createdAt) >= start && Date.parse(createdAt) < end);
  const previous = relevant.filter(({ createdAt }) => Date.parse(createdAt) >= prior && Date.parse(createdAt) < start);
  const points = Math.min(period, 12);
  const trend = Array.from({ length: points }, (_, index) => {
    const left = Math.floor(index * period / points) * day;
    const right = Math.floor((index + 1) * period / points) * day;
    const inBucket = (rows: AnalyticsRow[], origin: number) => rows.filter(({ createdAt }) => {
      const timestamp = Date.parse(createdAt);
      return timestamp >= origin + left && timestamp < origin + right;
    });
    return {
      label: today ? date.format(start + right - day) : "",
      ...counts(inBucket(current, start)),
      previous: counts(inBucket(previous, prior)).total,
    };
  });
  return { current, currentCounts: counts(current), previousCounts: counts(previous), trend };
}

function downloadCsv(deposits: AnalyticsRow[], grouped: boolean) {
  const header = grouped
    ? ["Tanggal", "Jenis kaca", "Status", "Setoran", "Wadah"]
    : ["Kode", "Tanggal", "Jenis kaca", "Jumlah", "Status", "Alasan"];
  const rows = [header, ...deposits.map((item) => "count" in item
    ? [new Date(item.createdAt).toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }), item.material, statusLabels[item.status], item.count, item.quantity]
    : [item.code, item.createdAt, item.material, item.quantity, statusLabels[item.status], item.reason ?? ""])];

  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = grouped ? "ringkasan-setoran-revessel.csv" : "setoran-revessel.csv";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function DepositAnalytics({ deposits, buckets }: { deposits: Deposit[]; buckets?: never } | { deposits?: never; buckets: DepositBucket[] }) {
  const { preferences: { period, material, compare }, setPreferences } = useDashboardPreferences();
  const today = useSyncExternalStore(subscribeToDay, currentDay, unknownDay);
  const allowMotion = useSyncExternalStore(subscribeToMotion, motionAllowed, motionOff);
  const rows = deposits ?? buckets;
  const metrics = buckets ? adminMetrics : residentMetrics;
  const { current, currentCounts, previousCounts, trend } = useMemo(
    () => getPeriodData(rows, period, material, today), [rows, period, material, today],
  );
  const animateChart = allowMotion && Boolean(current.length || (compare && previousCounts.total));
  const chartId = `volume-${useId().replace(/[^a-z0-9_-]/gi, "")}`;
  const checked = currentCounts.accepted + currentCounts.adjustment;
  const acceptedShare = checked ? Math.round(100 * currentCounts.accepted / checked) : 0;
  const adjustmentShare = checked ? 100 - acceptedShare : 0;

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <div className={styles.segment} aria-label="Rentang tanggal" role="group">
            <NavBubble active={String(period)} />
            {analyticsPeriods.map(([days, label]) => (
              <Button type="button" variant="ghost" size="sm" data-nav-item={String(days)} aria-label={days === 365 ? "12 bulan" : `${days} hari`} aria-pressed={period === days} key={days} onClick={() => setPreferences({ period: days })}>{label}</Button>
            ))}
          </div>
          <div className={styles.segment} aria-label="Jenis kaca" role="group">
            <NavBubble active={material} />
            {(["all", ...materials] as const).map((kind) => (
              <Button type="button" variant="ghost" size="sm" data-nav-item={kind} aria-pressed={material === kind} key={kind} onClick={() => setPreferences({ material: kind })}>
                {materialLabels[kind]}
              </Button>
            ))}
          </div>
        </div>
        <div className={styles.toolbarActions}>
          <button type="button" role="switch" aria-checked={compare} className={styles.compare} onClick={() => setPreferences({ compare: !compare })}>
            <span className={styles.switchTrack} aria-hidden="true" /> vs periode lalu
          </button>
          <Button size="sm" variant="outline" type="button" className={styles.export} disabled={!today} onClick={() => downloadCsv(current, Boolean(buckets))}>
            <Download aria-hidden="true" /> Ekspor CSV
          </Button>
        </div>
      </div>

      <section className={styles.summary} aria-label="Ringkasan setoran">
        {metrics.map(([key, label]) => {
          const change = currentCounts[key] - previousCounts[key];
          return (
            <Card className={styles.metric} data-primary={key === "total"} key={key}>
              <CardHeader className={styles.metricHeader}>
                <CardTitle className={styles.metricLabel}>{label}</CardTitle>
              </CardHeader>
              <CardContent className={styles.metricContent}>
                <p className={styles.metricValue}>{number.format(currentCounts[key])}</p>
                {compare ? (
                  <p className={styles.metricHint}><span data-direction={Math.sign(change)}>{change > 0 ? "+" : ""}{number.format(change)}</span> vs periode lalu</p>
                ) : (
                  <p className={styles.metricHint}>{period === 365 ? "12 bulan" : `${period} hari`} terakhir</p>
                )}
                <ChartContainer className={styles.sparkline} config={chartConfig} aria-hidden="true">
                  <AreaChart data={trend} margin={{ top: 3, right: 0, bottom: 3, left: 0 }}>
                    <YAxis hide domain={[0, (maximum: number) => Math.max(1, maximum)]} />
                    <Area dataKey={key} type="monotone" stroke="currentColor" strokeWidth={1.15} fill="transparent" dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className={styles.analyticsGrid}>
        <Card className={styles.panel}>
          <CardHeader className={styles.chartHeader}>
            <CardTitle className={styles.panelTitle}>Setoran dari waktu ke waktu</CardTitle>
            <p className={styles.chartTotal}>{number.format(currentCounts.total)}<span> setoran</span></p>
            <p className={styles.secondary}>{period === 365 ? "12 bulan" : `${period} hari`} terakhir</p>
          </CardHeader>
          <CardContent className={styles.chartContent}>
            <ChartContainer className={styles.volumeChart} config={chartConfig}>
              <AreaChart data={trend} accessibilityLayer margin={{ top: 12, right: 12, bottom: 0, left: -14 }}>
                <defs>
                  <linearGradient id={chartId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-total)" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="var(--color-total)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="2 4" />
                <YAxis allowDecimals={false} domain={[0, (maximum: number) => Math.max(4, maximum)]} axisLine={false} tickLine={false} width={42} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={8} minTickGap={22} />
                <ChartTooltip content={<ChartTooltipContent />} />
                {compare && <ChartLegend verticalAlign="top" height={0} wrapperStyle={{ top: -43 }} content={<ChartLegendContent className={styles.chartLegend} />} />}
                <Area dataKey="total" type="monotone" fill={`url(#${chartId})`} fillOpacity={1} stroke="var(--color-total)" strokeWidth={1.8}
                  isAnimationActive={animateChart} animationDuration={320} animationEasing="ease-out" />
                {compare && <Area dataKey="previous" type="monotone" fill="transparent" stroke="var(--color-previous)" strokeWidth={1.2} strokeDasharray="4 4"
                  isAnimationActive={animateChart} animationDuration={320} animationEasing="ease-out" />}
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className={`${styles.panel} ${styles.outcomes}`}>
          <CardHeader className={styles.chartHeader}>
            <CardTitle className={styles.panelTitle}>Hasil pemeriksaan</CardTitle>
          </CardHeader>
          <CardContent className={styles.outcomeContent}>
            <div className={styles.shares}>
              <p><strong>{acceptedShare}%</strong> Diterima</p>
              <p><strong>{adjustmentShare}%</strong> Penyesuaian</p>
            </div>
            <Progress className={styles.progress} value={acceptedShare} aria-label="Persentase setoran yang diterima" />
            <dl className={styles.outcomeRows}>
              <div><dt>Diterima</dt><dd>{number.format(currentCounts.accepted)} setoran</dd></div>
              <div><dt>Perlu penyesuaian</dt><dd>{number.format(currentCounts.adjustment)} setoran</dd></div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
