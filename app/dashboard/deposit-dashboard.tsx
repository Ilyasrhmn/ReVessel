"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { BookOpen, Boxes, CircleHelp, ClipboardCheck, Gift, History, MapPin, Plus, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CollectionMap from "../ui/collection-map";
import { bottleChecklist, bottleQuestions } from "../bottle-guide";
import { maxBottles, type CollectionPoint } from "../deposit-options";
import { fulfillmentLabels, statusLabels, type Deposit } from "./deposit-store";
import { cancelDeposit as cancelOnServer, createDeposit } from "./deposit-actions";
import DashboardShell from "./dashboard-shell";
import DepositReview from "./deposit-review";
import DepositFulfillment from "./deposit-fulfillment";
import ResidentRewards, { type ResidentRewardData } from "./resident-rewards";
import styles from "./dashboard.module.css";
import DepositAnalytics, { type MaterialFilter, type Period } from "./deposit-analytics";
import { dashboardHref, dashboardSection, type DashboardSection } from "./sections";

const dateFormat = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });

function Status({ deposit }: { deposit: Deposit }) {
  return <Badge className={styles.status} variant="secondary" data-state={deposit.status}>{statusLabels[deposit.status]}</Badge>;
}

const sections = {
  ringkasan: { label: "Ringkasan", title: "Ringkasan setoran", icon: Boxes },
  setoran: { label: "Setoran saya", title: "Setoran saya", icon: History },
  "titik-kumpul": { label: "Titik kumpul", title: "Titik kumpul", icon: MapPin },
  poin: { label: "Poin & reward", title: "Poin & reward", icon: Gift },
  panduan: { label: "Panduan", title: "Panduan botol", icon: BookOpen },
  pemeriksaan: { label: "Pemeriksaan", title: "Pemeriksaan setoran", icon: ClipboardCheck },
} as const;

const sectionKeys = Object.keys(sections) as DashboardSection[];

export default function DepositDashboard({ deposits, points, profile, rewards }: {
  rewards: ResidentRewardData | null;
  deposits: Deposit[];
  points: CollectionPoint[];
  profile: { name: string; role: "resident" | "reviewer" };
}) {
  const isReviewer = profile.role === "reviewer";
  const requested = useSearchParams().get("bagian");
  const view = dashboardSection(requested);
  const [period, setPeriod] = useState<Period>(30);
  const [material, setMaterial] = useState<MaterialFilter>("all");
  const [compare, setCompare] = useState(true);
  const [newDeposit, setNewDeposit] = useState<Deposit | null>(null);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pointSlug, setPointSlug] = useState("");
  const selectedPoint = points.find((point) => point.slug === pointSlug);
  const requestId = useRef("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  function openDeposit() {
    if (isReviewer || !points.length) return;
    setFormError("");
    setNewDeposit(null);
    setPointSlug(points.length === 1 ? points[0].slug : "");
    requestId.current = crypto.randomUUID();
    dialogRef.current?.showModal();
  }

  async function saveDeposit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = new FormData(event.currentTarget);
    form.set("requestId", requestId.current);
    setFormError("");
    setSubmitting(true);
    try {
      const result = await createDeposit(form);
      if (result.deposit) setNewDeposit(result.deposit);
      else setFormError(result.error);
    } catch {
      setFormError("Setoran belum tersimpan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setNotice("Kode setoran disalin.");
    } catch {
      setNotice(`Salin kode ini secara manual: ${code}`);
    }
  }

  async function cancelDeposit(code: string) {
    try {
      const result = await cancelOnServer(code);
      setNotice(result.error ?? "Setoran dibatalkan.");
    } catch {
      setNotice("Setoran belum bisa dibatalkan.");
    }
  }

  const items = sectionKeys.filter((section) => isReviewer ? !["ringkasan", "setoran", "poin"].includes(section) : section !== "pemeriksaan").map((section) => {
    const { label, icon: Icon } = sections[section];
    return { id: section, href: dashboardHref(section), label, icon: <Icon aria-hidden="true" />, count: section === "setoran" ? deposits.length : undefined };
  });
  const shortcuts = [
    isReviewer
      ? { id: "pemeriksaan", href: dashboardHref("pemeriksaan"), label: "Cari kode setoran", icon: <Search aria-hidden="true" /> }
      : { id: "ringkasan", href: dashboardHref("ringkasan"), label: "Ringkasan", icon: <Boxes aria-hidden="true" /> },
    { id: "titik-kumpul", href: dashboardHref("titik-kumpul"), label: "Titik kumpul", icon: <MapPin aria-hidden="true" /> },
    { id: "panduan", href: dashboardHref("panduan"), label: "Panduan botol", icon: <CircleHelp aria-hidden="true" /> },
  ];
  const canDeposit = !isReviewer && points.length > 0;

  const depositDialog = !isReviewer && (
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="create-title" onClose={() => setNotice("")}
      onCancel={(event) => { if (submitting) event.preventDefault(); }}>
      <button type="button" className={styles.close} aria-label="Tutup setoran" disabled={submitting} onClick={() => dialogRef.current?.close()}>
        <X aria-hidden="true" />
      </button>
      <h2 id="create-title">{newDeposit ? "Pengajuan terkirim" : "Buat setoran"}</h2>
      {newDeposit ? (
        <div className={`${styles.fields} ${styles.appear}`}>
          <output className={styles.code}>{newDeposit.code}</output>
          <p className={styles.secondary}>Pilih cara serah terima setelah operator menyetujui setoran.</p>
          <Button asChild className={styles.action}>
            <Link href={dashboardHref("setoran")} onClick={() => dialogRef.current?.close()}>Lihat pengajuan</Link>
          </Button>
          <p role="status" className={styles.feedback}>{notice}</p>
        </div>
      ) : (
        <form className={styles.fields} onSubmit={saveDeposit}>
          <div className={styles.field}>
            <label htmlFor="deposit-point">Titik kumpul</label>
            <select id="deposit-point" name="point" required value={pointSlug} onChange={(event) => setPointSlug(event.target.value)}>
              <option value="" disabled>Pilih titik kumpul</option>
              {points.map((point) => <option key={point.slug} value={point.slug}>{point.name}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="deposit-material">Jenis kaca</label>
            <select id="deposit-material" name="material" key={pointSlug} defaultValue="" required disabled={!selectedPoint}>
              <option value="" disabled>Pilih jenis kaca</option>
              {selectedPoint?.materials.map((material) => <option key={material}>{material}</option>)}
            </select>
          </div>
          <label className={styles.field}>
            <span>Jumlah wadah</span>
            <input required name="quantity" type="number" inputMode="numeric" min={1} max={maxBottles} step={1} />
          </label>
          <p role="alert" className={styles.feedback}>{formError}</p>
          <Button type="submit" className={styles.action} disabled={submitting}>{submitting ? "Mengirim pengajuan…" : "Ajukan setoran"}</Button>
        </form>
      )}
    </dialog>
  );

  return (
    <DashboardShell
      view={view}
      title={sections[view].title}
      homeHref={dashboardHref(isReviewer ? "pemeriksaan" : "ringkasan")}
      profile={{ name: profile.name, role: isReviewer ? "Petugas" : "Warga" }}
      items={items}
      shortcuts={shortcuts}
      activity={isReviewer ? undefined : { href: dashboardHref("setoran"), label: "Lihat aktivitas setoran" }}
      primaryAction={canDeposit && <button type="button" onClick={openDeposit}><Plus aria-hidden="true" /> Buat setoran</button>}
      dockAction={canDeposit && (
        <Tooltip>
          <TooltipTrigger asChild><button type="button" aria-label="Ajukan setoran baru" onClick={openDeposit}><Plus aria-hidden="true" /></button></TooltipTrigger>
          <TooltipContent side="right">Buat setoran</TooltipContent>
        </Tooltip>
      )}
      overlay={depositDialog}
    >
      {view === "poin" && rewards ? <ResidentRewards data={rewards} /> : view === "panduan" ? (
        <div className={styles.guideGrid}>
          <Card className={styles.panel}>
            <h2>Persiapan sebelum setor</h2>
            <ul className={styles.guideList}>
              {bottleChecklist.map((step) => <li key={step}>{step}</li>)}
            </ul>
            <Link href={dashboardHref("titik-kumpul")} className={`${styles.guideLink} link-reveal`}>
              <MapPin aria-hidden="true" />
              <span>Lihat titik kumpul</span>
            </Link>
          </Card>
          <Card className={styles.panel}>
            <h2>Pertanyaan umum</h2>
            <div className={styles.history}>
              {bottleQuestions.map(([question, answer]) => (
                <details key={question}>
                  <summary className={styles.row}>{question}<span className={styles.expand} aria-hidden="true" /></summary>
                  <p className={styles.guideAnswer}>{answer}</p>
                </details>
              ))}
            </div>
          </Card>
        </div>
      ) : view === "pemeriksaan" && isReviewer ? (
        points.length ? <DepositReview /> : <p className={styles.panel}>Akun ini belum ditugaskan ke titik kumpul yang aktif.</p>
      ) : (
        <>
          {view === "ringkasan" && <DepositAnalytics deposits={deposits} period={period} material={material} compare={compare} setPeriod={setPeriod} setMaterial={setMaterial} setCompare={setCompare} />}

          <div className={styles.columns} data-wide={view !== "ringkasan"}>
            {view === "titik-kumpul" && <CollectionMap />}
            {view !== "titik-kumpul" && <Card role="region" className={styles.panel} aria-labelledby="history-title">
              <h2 id="history-title">Riwayat setoran</h2>
              {deposits.length ? (
                <ul className={styles.history}>
                  {deposits.map((deposit) => (
                    <li key={deposit.code}>
                      <details>
                        <summary className={styles.row}>
                          <span><strong>{deposit.code}</strong><small>{deposit.material} · {deposit.quantity} wadah</small></span>
                          <div className={styles.rowEnd}>
                            <Status deposit={deposit} />
                            <span className={styles.expand} aria-hidden="true" />
                          </div>
                        </summary>
                        <div className={styles.detail}>
                          <p>{deposit.pointName} · {dateFormat.format(new Date(deposit.createdAt))}</p>
                          {deposit.reason && <p className={styles.reason}>{deposit.reason} Buat setoran baru setelah botol siap.</p>}
                          {deposit.approvalNote && <p className={styles.reason}>{deposit.approvalNote}</p>}
                          {deposit.method && <p>{fulfillmentLabels[deposit.method]}</p>}
                          {deposit.status === "waiting" && deposit.method === "pickup" && <p>Operator akan menghubungimu untuk mengatur penjemputan.</p>}
                          {deposit.status === "approved" && <DepositFulfillment code={deposit.code} />}
                          {["pending_approval", "approved", "waiting"].includes(deposit.status) && (
                            <div className={styles.detailActions}>
                              {deposit.status === "waiting" && <button type="button" className={styles.subtle} onClick={() => copyCode(deposit.code)}>Salin kode</button>}
                              <button type="button" className={styles.subtle} onClick={() => cancelDeposit(deposit.code)}>Batalkan setoran</button>
                            </div>
                          )}
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={styles.empty}>
                  <h3>Belum ada setoran</h3>
                  <p>{points.length ? "Ajukan setoran untuk diperiksa operator." : "Setoran bisa dibuat setelah titik kumpul aktif tersedia."}</p>
                </div>
              )}
              <p role="status" className={styles.feedback}>{notice}</p>
            </Card>}

            {view !== "setoran" && <Card role="region" className={styles.panel} aria-labelledby="point-title">
              <h2 id="point-title">Titik setoran ReVessel</h2>
              {points.length ? points.map((point) => (
                <div className={styles.pointDetails} key={point.slug}>
                  <h3>{point.name}</h3>
                  <p>{point.address}</p>
                  <ul>{point.materials.map((material) => <li key={material}>{material}</li>)}</ul>
                </div>
              )) : <p className={styles.secondary}>{isReviewer ? "Belum ada titik kumpul aktif yang ditugaskan padamu." : "Belum ada titik kumpul aktif."}</p>}
              <Link href={dashboardHref("panduan")} className={`${styles.guideLink} link-reveal`}>
                <BookOpen aria-hidden="true" />
                <span>Panduan menyiapkan botol</span>
              </Link>
            </Card>}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
