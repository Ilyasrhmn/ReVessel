import type { DepositBucket } from "@/app/dashboard/deposit-analytics";
import type { BrowserState, Cashout, Workspace } from "./data";
import { isKnownCollectionPointId } from "@/app/collection-directory";
import type { Deposit } from "@/app/dashboard/deposit-store";
import { pointsForWeight, rupiah } from "./glass-value";

export function residentDeposits(workspace: Workspace, owner: string) {
  return workspace.deposits.filter((row) => row.owner === owner).map(({ item }) => item);
}

export function rewardCatalog(workspace: Workspace) {
  return [...workspace.rewards].sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0));
}

export function pendingRedemptions(workspace: Workspace) {
  return workspace.claims.filter((claim) => !claim.fulfilled).map((claim) => {
    const reward = workspace.rewards.find(({ id }) => id === claim.rewardId)!;
    return { code: claim.code, name: claim.rewardName ?? reward.name };
  });
}

export function cashoutTotals(entries: readonly Cashout[]) {
  return {
    paid: entries.reduce((total, entry) => total + (entry.status === "paid" ? entry.amount : 0), 0),
    pending: entries.reduce((total, entry) => total + (entry.status === "pending" ? entry.amount : 0), 0),
  };
}

export function residentRewards(workspace: Workspace, owner: string) {
  const deposits = workspace.deposits.filter((row) => row.owner === owner && row.item.status === "accepted");
  const claims = workspace.claims.filter((claim) => claim.owner === owner).map((claim) => {
    const reward = workspace.rewards.find(({ id }) => id === claim.rewardId)!;
    return { ...claim, kind: "item" as const, name: claim.rewardName ?? reward.name, pickup: reward.pickup };
  });
  const cashouts = (workspace.cashouts ?? []).filter((entry) => entry.owner === owner);
  const cashTotals = cashoutTotals(cashouts);
  const cashRedemptions = (workspace.cashRedemptions ?? []).filter((entry) => entry.owner === owner);
  const walletCredits = cashRedemptions.reduce((total, entry) => total + entry.amount, 0);
  const committedCash = cashouts.reduce((total, entry) => total + (entry.fromWallet && (entry.status === "pending" || entry.status === "paid") ? entry.amount : 0), 0);
  const cashClaims = cashRedemptions.map((entry) => ({
    ...entry, kind: "cash" as const, code: "cash-" + entry.requestId, name: rupiah(entry.amount),
  }));
  const activity = [
    ...deposits.map(({ item, reviewedAt }) => ({
      code: item.code,
      points: item.weightGrams === undefined ? (item.quantity ?? 0) : pointsForWeight(item.weightGrams),
      description: item.weightGrams === undefined ? "Poin setoran lama" : "Setoran " + item.material.toLowerCase(),
      weightGrams: item.weightGrams,
      date: reviewedAt ?? item.createdAt,
    })),
    ...claims.map((claim) => ({ code: claim.code, points: -claim.cost, description: claim.name, date: claim.createdAt })),
    ...cashClaims.map((entry) => ({ code: entry.code, points: -entry.cost, description: entry.name, date: entry.createdAt })),
    ...cashouts.flatMap((entry) => {
      if (entry.cost === undefined) return [];
      const debit = { code: entry.code, points: -entry.cost, description: rupiah(entry.amount), date: entry.createdAt };
      return entry.resolvedAt && (entry.status === "rejected" || entry.status === "cancelled")
        ? [debit, { code: entry.code + "-refund", points: entry.cost, description: "Pengembalian poin pencairan", date: entry.resolvedAt }]
        : [debit];
    }),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const balance = activity.reduce((total, entry) => total + entry.points, 0);
  return {
    rewards: rewardCatalog(workspace),
    cashBalance: Math.max(0, walletCredits - committedCash),
    cashouts,
    paidCash: cashTotals.paid,
    pendingCash: cashTotals.pending,
    balance,
    activity,
    redemptions: [...claims, ...cashClaims].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

export function adminDeposits(workspace: Workspace, status: Deposit["status"] | null, limit?: number) {
  return workspace.deposits.map(({ item }) => item)
    .filter((deposit) => !status || deposit.status === status)
    .sort((a, b) => Number(b.status === "pending_approval") - Number(a.status === "pending_approval") || b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function adminDepositBuckets(workspace: Workspace): DepositBucket[] {
  const counts = new Map<string, DepositBucket>();
  for (const { item } of workspace.deposits) {
    const day = new Date(Date.parse(item.createdAt) + 7 * 3600000).toISOString().slice(0, 10);
    const key = [day, item.material, item.status].join("|");
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
      if (item.weightGrams !== undefined) existing.weightGrams = (existing.weightGrams ?? 0) + item.weightGrams;
    } else {
      counts.set(key, { createdAt: new Date(`${day}T00:00:00+07:00`).toISOString(), count: 1, material: item.material, status: item.status, weightGrams: item.weightGrams });
    }
  }
  return [...counts.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function dashboardResidents(state: BrowserState, mode: "demo" | "account") {
  const accounts = state.accounts.filter(({ role, password }) => role === "resident" && (mode === "account" || !password));
  return { total: accounts.length, entries: accounts.reverse() };
}

export function reviewDetails(workspace: Workspace, code: string) {
  const row = workspace.deposits.find((entry) => entry.item.code === code && isKnownCollectionPointId(entry.point));
  return row ? { deposit: row.item, pickup: row.pickup ?? null } : null;
}
