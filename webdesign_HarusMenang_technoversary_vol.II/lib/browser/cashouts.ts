import type { CashoutStatus, Workspace } from "./data";
import { nextCode, scopedChange } from "./deposits";
import { residentRewards } from "./selectors";
import { cashReward, minimumCashout, rupiah } from "./glass-value";

export const cashoutStatus: Record<CashoutStatus, string> = {
  pending: "Menunggu admin",
  paid: "Pencairan tercatat",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
};

const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;

function queueCashout(data: Workspace, owner: string, requestId: string, amount: number, createdAt: string) {
  const entries = data.cashouts ??= [];
  const code = nextCode("CU", entries, 6);
  entries.unshift({ code, owner, requestId, amount, createdAt, fromWallet: true, status: "pending" });
  return code;
}

export function requestCashout(requestId: string, amount: number) {
  return scopedChange("resident", (data, user) => {
    if (!uuid.test(requestId) || !Number.isSafeInteger(amount)) return { error: "Nominal pencairan tidak valid." };
    if (amount < minimumCashout) return { error: `Minimum pencairan ${rupiah(minimumCashout)}.` };
    const entries = data.cashouts ?? [];
    const prior = entries.find((entry) => entry.owner === user.id && entry.requestId === requestId);
    if (prior) return prior.amount === amount ? { code: prior.code } : { error: "Nominal pengajuan sudah ditetapkan." };
    if (entries.some((entry) => entry.owner === user.id && entry.status === "pending")) {
      return { error: "Masih ada pencairan yang menunggu admin." };
    }
    if (residentRewards(data, user.id).cashBalance !== amount) {
      return { error: "Saldo berubah. Tutup formulir dan periksa nominal terbaru." };
    }
    return { code: queueCashout(data, user.id, requestId, amount, new Date().toISOString()) };
  });
}

export function redeemCash(requestId: string, withdrawalAmount?: number) {
  return scopedChange("resident", (data, user) => {
    if (!uuid.test(requestId)) return { error: "Permintaan penukaran tidak valid." };
    const redemptions = data.cashRedemptions ?? [];
    const prior = redemptions.find((entry) => entry.owner === user.id && entry.requestId === requestId);
    if (prior) {
      return prior.withdrawalAmount === withdrawalAmount ? { success: true } : { error: "Penukaran ini sudah tercatat." };
    }
    const entries = data.cashouts ?? [];
    const rewards = residentRewards(data, user.id);
    if (rewards.balance < cashReward.cost) return { error: "Poin belum cukup untuk penukaran ini." };
    if (withdrawalAmount !== undefined) {
      if (entries.some((entry) => entry.owner === user.id && entry.status === "pending")) return { error: "Masih ada pencairan yang menunggu admin." };
      if (withdrawalAmount !== rewards.cashBalance + cashReward.amount) return { error: "Saldo berubah. Tutup formulir dan periksa nominal terbaru." };
    }
    const createdAt = new Date().toISOString();
    (data.cashRedemptions ??= []).unshift({ ...cashReward, owner: user.id, requestId, createdAt, withdrawalAmount });
    if (withdrawalAmount !== undefined) queueCashout(data, user.id, requestId, withdrawalAmount, createdAt);
    return { success: true };
  });
}

export function reviewCashout(code: string, decision: "paid" | "rejected" | "cancelled") {
  if (decision !== "paid" && decision !== "rejected" && decision !== "cancelled") {
    return Promise.resolve({ error: "Keputusan tidak valid." });
  }
  return scopedChange(decision === "cancelled" ? "resident" : "admin", (data, user) => {
    const entry = data.cashouts?.find((item) => item.code === code);
    if (!entry || (decision === "cancelled" && entry.owner !== user.id)) {
      return { error: "Pengajuan tidak ditemukan." };
    }
    if (entry.status === decision) return { success: true };
    if (entry.status !== "pending") return { error: "Pengajuan ini sudah diproses." };
    entry.status = decision;
    entry.resolvedAt = new Date().toISOString();
    return { success: true };
  });
}
