import { currentProfile, changeState, readState } from "./storage";
import { collectionPoints, type BrowserState, type Mode, type Profile, type Role, type Workspace } from "./data";
import { reviewDetails } from "./selectors";
import { isDepositPhoto, prepareDepositPhoto } from "./deposit-photo";
import { validMaterial, validQuantity, validReason, type Deposit } from "@/app/dashboard/deposit-store";

const noAccess = "Kamu tidak punya akses untuk melakukan tindakan ini.";
const unavailable = "Setoran tidak ditemukan atau statusnya sudah berubah.";
const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;

export function scopedChange<T>(role: Role, change: (data: Workspace, user: Profile & { mode: Mode }, state: BrowserState) => T) {
  const actor = currentProfile(readState());
  return changeState((state) => {
    const user = currentProfile(state);
    if (actor?.role !== role || user?.role !== role || user.id !== actor.id || user.mode !== actor.mode) return { error: noAccess };
    return change(state.workspaces[user.mode], user, state);
  });
}

export function nextCode(prefix: string, deposits: { code: string }[], bytes: number) {
  let code: string;
  do {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (value) => value.toString(16).padStart(2, "0")).join("").toUpperCase();
    code = `${prefix}-${token}`;
  } while (deposits.some((entry) => entry.code === code));
  return code;
}

export async function createDeposit(form: FormData) {
  const point = form.get("point");
  const material = form.get("material");
  const quantity = Number(form.get("quantity"));
  const requestId = form.get("requestId");
  return saveWithPhoto(form.get("photo"), (data, user, photo) => {
    if (typeof requestId !== "string" || !uuid.test(requestId) || !validMaterial(material) || !validQuantity(quantity)) {
      return { error: "Pilih titik kumpul dan jenis kaca, lalu masukkan jumlah yang sesuai." };
    }
    const prior = data.deposits.find((row) => row.owner === user.id && row.requestId === requestId);
    if (prior) return { deposit: prior.item };
    const selected = collectionPoints.find(({ slug, materials }) => slug === point && materials.includes(material));
    if (!selected) return { error: "Titik kumpul tidak tersedia atau tidak menerima jenis kaca ini." };
    const deposit: Deposit = {
      code: nextCode("RV", data.deposits.map(({ item }) => item), 4),
      material, quantity, pointName: selected.name, createdAt: new Date().toISOString(),
      status: "pending_approval", method: null, approvalNote: null, photo,
    };
    data.deposits.unshift({ item: deposit, point: selected.slug, owner: user.id, requestId });
    return { deposit };
  });
}

async function saveWithPhoto<T>(file: FormDataEntryValue | null, save: (data: Workspace, user: Profile, photo: string) => T) {
  const owner = currentProfile(readState());
  if (owner?.role !== "resident") return { error: noAccess };
  const photo = await prepareDepositPhoto(file);
  if (typeof photo !== "string") return photo;
  try {
    return await scopedChange("resident", (data, user) => {
      if (owner.id !== user.id || owner.mode !== user.mode) return { error: noAccess };
      return save(data, user, photo);
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      return { error: "Penyimpanan browser penuh. Foto belum tersimpan." };
    }
    throw error;
  }
}

export function attachDepositPhoto(code: string, form: FormData) {
  return saveWithPhoto(form.get("photo"), (data, user, photo) => {
    const row = data.deposits.find(({ item, owner }) => item.code === code && owner === user.id);
    if (row?.item.status !== "pending_approval") return { error: unavailable };
    row.item = { ...row.item, photo };
    return { success: true };
  });
}

export function cancelDeposit(code: string) {
  return scopedChange("resident", (data, user) => {
    const row = data.deposits.find(({ item, owner }) => item.code === code && owner === user.id);
    if (!row || row.item.status === "adjustment" || !["pending_approval", "approved", "waiting"].includes(row.item.status)) return { error: unavailable };
    row.item = { ...row.item, status: "cancelled" };
    delete row.pickup;
    return { success: true };
  });
}

export function lookupDeposit(code: string) {
  const state = readState();
  const user = currentProfile(state);
  if (user?.role !== "admin") return { error: noAccess };
  if (!/^RV-[A-F0-9]{8}$/.test(code)) return { error: "Masukkan kode lengkap seperti RV-XXXXXXXX." };
  return reviewDetails(state.workspaces[user.mode], code) ?? { error: "Kode tidak ditemukan di titik kumpul aktif." };
}

export function decideApproval(code: string, form: FormData) {
  const decision = form.get("decision");
  const note = String(form.get("note") ?? "").trim();
  return scopedChange("admin", (data) => {
    if (decision !== "approve" && decision !== "reject") return { error: "Pilih keputusan untuk pengajuan ini." };
    if (decision === "reject" && (!note || note.length > 240)) return { error: "Isi alasan penolakan." };
    const row = data.deposits.find(({ item }) => item.code === code);
    if (row?.item.status !== "pending_approval") return { error: "Pengajuan tidak tersedia atau sudah diputuskan." };
    if (decision === "approve" && !isDepositPhoto(row.item.photo)) return { error: "Foto setoran belum tersedia." };
    row.item = { ...row.item, status: decision === "approve" ? "approved" : "rejected", approvalNote: decision === "reject" ? note : null };
    return { deposit: row.item };
  });
}

export function chooseFulfillment(code: string, form: FormData) {
  const method = form.get("method");
  const address = String(form.get("address") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim().replace(/[\s()-]/g, "");
  return scopedChange("resident", (data, user) => {
    if (method !== "dropoff" && method !== "pickup") return { error: "Pilih cara serah terima." };
    const row = data.deposits.find(({ item, owner }) => item.code === code && owner === user.id);
    if (row?.item.status !== "approved") return { error: "Cara serah terima hanya bisa dipilih setelah setoran disetujui." };
    if (method === "pickup" && (address.length < 10 || address.length > 400 || !/^\+?\d{8,15}$/.test(phone) || form.get("share") !== "on")) {
      return { error: "Isi alamat dan nomor HP, lalu konfirmasi penjemputan." };
    }
    row.item = { ...row.item, status: "waiting", method };
    if (method === "pickup") row.pickup = { address, phone };
    return { success: true };
  });
}

export function submitReview(code: string, form: FormData) {
  const reason = form.get("reason");
  return scopedChange("admin", (data) => {
    if (reason && !validReason(reason)) return { error: "Pilih alasan penyesuaian." };
    if (!reason && form.get("verified") !== "on") return { error: "Konfirmasi kondisi, jenis, dan jumlah botol sebelum menerima setoran." };
    const row = data.deposits.find(({ item }) => item.code === code);
    if (row?.item.status !== "waiting") return { error: unavailable };
    row.item = validReason(reason)
      ? { ...row.item, status: "adjustment", reason }
      : { ...row.item, status: "accepted" };
    row.reviewedAt = new Date().toISOString();
    delete row.pickup;
    return { deposit: row.item };
  });
}
