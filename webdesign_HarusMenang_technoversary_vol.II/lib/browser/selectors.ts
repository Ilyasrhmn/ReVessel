import type { DepositBucket } from "@/app/dashboard/deposit-analytics";
import type { BrowserState, Workspace } from "./data";
import { isKnownCollectionPointId } from "@/app/collection-directory";
import type { Deposit } from "@/app/dashboard/deposit-store";
import { pointsForWeight } from "./glass-value";

export function residentDeposits(workspace: Workspace, owner: string) {
  return workspace.deposits.filter((row) => row.owner === owner).map(({ item }) => item);
}

export function rewardCatalog(workspace: Workspace) {
  return [...workspace.rewards].sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0));
}

export function pendingRedemptions(workspace: Workspace) {
  return workspace.claims.filter((claim) => !claim.fulfilled).slice(0, 25).map((claim) => {
    const reward = workspace.rewards.find(({ id }) => id === claim.rewardId)!;
    return { code: claim.code, name: reward.name };
  });
}

export function residentRewards(workspace: Workspace, owner: string) {
  const deposits = workspace.deposits.filter((row) => row.owner === owner && row.item.status === "accepted");
  const claims = workspace.claims.filter((claim) => claim.owner === owner).map((claim) => {
    const reward = workspace.rewards.find(({ id }) => id === claim.rewardId)!;
    return { ...claim, name: reward.name, pickup: reward.pickup };
  });
  const activity = [
    ...deposits.map(({ item, reviewedAt }) => ({
      code: item.code,
      points: item.weightGrams === undefined ? (item.quantity ?? 0) : pointsForWeight(item.weightGrams),
      description: item.weightGrams === undefined ? "Poin setoran lama" : "Setoran " + item.material.toLowerCase(),
      weightGrams: item.weightGrams,
      date: reviewedAt ?? item.createdAt,
    })),
    ...claims.map((claim) => ({ code: claim.code, points: -claim.cost, description: claim.name, date: claim.createdAt })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  return {
    rewards: rewardCatalog(workspace),
    balance: activity.reduce((balance, entry) => balance + entry.points, 0),
    activity: activity.slice(0, 25),
    redemptions: claims.sort((a, b) => Number(a.fulfilled) - Number(b.fulfilled)).slice(0, 25),
  };
}

export function adminDeposits(workspace: Workspace, status: Deposit["status"] | null, limit: number) {
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
  return { total: accounts.length, entries: accounts.slice(-25).reverse() };
}

export function reviewDetails(workspace: Workspace, code: string) {
  const row = workspace.deposits.find((entry) => entry.item.code === code && isKnownCollectionPointId(entry.point));
  return row ? { deposit: row.item, pickup: row.pickup ?? null } : null;
}
