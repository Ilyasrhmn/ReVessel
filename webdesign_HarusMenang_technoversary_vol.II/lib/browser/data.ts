import { materials, type AnalyticsPeriod, type CollectionPoint, type Material } from "@/app/deposit-options";
import { collectionDirectory } from "@/app/collection-directory";
import type { Deposit, PickupDetails } from "@/app/dashboard/deposit-store";
import { depositPhotoAssets } from "./deposit-photo-assets";
import { cashReward, gramsPerPoint, minimumCashout } from "./glass-value";

export const demoResident = { id: "resident-demo", name: "Warga ReVessel", email: "user@revessel.com", role: "resident" } as const;
export const demoAdmin = { id: "admin-demo", name: "Admin ReVessel", email: "admin@revessel.com", role: "admin" } as const;
export const demoAccounts = [
  { ...demoResident, demoPassword: "user123" },
  { ...demoAdmin, demoPassword: "admin123" },
] as const;

export type Mode = "demo" | "account";
export type Role = "resident" | "admin";
export type Session = { mode: Mode; id: string };
export type Profile = { id: string; name: string; email: string; role: Role };
export type Account = Profile & { createdAt: string; password?: { salt: string; verifier: string } };
export type DepositRecord = {
  item: Deposit;
  owner: string;
  point: string;
  requestId?: string;
  reviewedAt?: string;
  pickup?: PickupDetails;
};
export type Reward = { id: string; name: string; pickup: string; cost: number; stock: number };
export type Claim = {
  code: string; owner: string; rewardId: string; rewardName?: string; requestId?: string; cost: number; createdAt: string; fulfilled: boolean;
};
export type ContactMessage = { id: string; owner?: string; name: string; email: string; subject?: string; body: string; sentAt: string };
export type CashoutStatus = "pending" | "paid" | "rejected" | "cancelled";
export type Cashout = {
  code: string; owner: string; requestId: string; amount: number;
  /** Point debit on withdrawals made before the rupiah balance was introduced. */
  cost?: number;
  fromWallet?: true;
  status: CashoutStatus; createdAt: string; resolvedAt?: string;
};
export type CashRedemption = {
  owner: string; requestId: string; cost: number; amount: number; createdAt: string; withdrawalAmount?: number;
};
export type Workspace = {
  deposits: DepositRecord[]; rewards: Reward[]; claims: Claim[]; messages: ContactMessage[];
  cashouts?: Cashout[]; cashRedemptions?: CashRedemption[]; demoWalletSeeded?: true;
};
export type DashboardPreferences = { dark: boolean; period: AnalyticsPeriod; material: Material | "all"; compare: boolean };
export type BrowserState = {
  version: 1;
  workspaceVersion?: 2;
  session: Session | null;
  accounts: Account[];
  preferences?: Record<string, DashboardPreferences>;
  workspaces: Record<Mode, Workspace>;
};

export const collectionPoints: CollectionPoint[] = collectionDirectory.map((point) => ({
  slug: point.id,
  name: point.name,
  address: point.area,
  materials: [...point.materials],
}));

export const defaultRewardCatalog = [
  { id: "b0d2be6d-f0a3-4151-9e26-92abaa8d9ce1", oldName: "Wadah kaca pakai ulang", oldCost: 12, name: "Stoples kaca rekondisi 250 ml", cost: 125, stock: 6 },
  { id: "74f658ef-68c0-4ff8-a31f-d927cb29db03", oldName: "Bibit tanaman", oldCost: 8, name: "Bibit cabai siap tanam (1 polybag)", cost: 25, stock: 10 },
] as const;

function seed(now: number): Workspace {
  const ago = (days: number) => new Date(now - days * 86400000).toISOString();
  const firstDeposits = ["pending_approval", "approved", "waiting", "accepted", "adjustment", "rejected", "cancelled", "accepted"] as const;
  const priorDeposits = [
    [2, "Botol parfum", 24_000, "accepted"],
    [4, "Botol minuman", 38_000, "accepted"],
    [5, "Jar kaca", 2_400, "adjustment"],
    [6, "Botol kosmetik", 12_500, "accepted"],
    [8, "Jar kaca", 19_000, "accepted"],
    [9, "Botol parfum", 3_800, "rejected"],
    [11, "Botol sirup", 26_000, "accepted"],
    [14, "Botol kosmetik", 6_100, "adjustment"],
    [15, "Botol minuman", 31_000, "accepted"],
    [18, "Botol sirup", 5_300, "cancelled"],
    [24, "Jar kaca", 67_000, "accepted"],
    [27, "Botol parfum", 4_700, "adjustment"],
    [28, "Botol sirup", 76_000, "accepted"],
    [31, "Botol kosmetik", 30_000, "accepted"],
    [34, "Botol parfum", 2_200, "adjustment"],
    [36, "Botol parfum", 52_000, "accepted"],
    [39, "Jar kaca", 45_000, "accepted"],
    [40, "Botol kosmetik", 1_900, "rejected"],
    [44, "Botol sirup", 28_000, "accepted"],
    [46, "Botol minuman", 56_000, "accepted"],
    [49, "Botol parfum", 3_600, "cancelled"],
    [52, "Jar kaca", 42_000, "accepted"],
    [57, "Botol minuman", 55_000, "accepted"],
    [62, "Botol parfum", 27_500, "accepted"],
    [72, "Botol kosmetik", 2_500, "adjustment"],
    [81, "Botol sirup", 74_000, "accepted"],
    [113, "Jar kaca", 5_300, "rejected"],
    [133, "Jar kaca", 43_000, "accepted"],
    [158, "Botol minuman", 4_200, "adjustment"],
    [215, "Botol minuman", 60_000, "accepted"],
    [390, "Botol kosmetik", 41_500, "accepted"],
    [428, "Botol parfum", 3_100, "adjustment"],
    [480, "Botol parfum", 70_000, "accepted"],
    [250, "Botol sirup", 62_500, "accepted"],
    [275, "Jar kaca", 62_500, "accepted"],
  ] as const satisfies ReadonlyArray<readonly [number, Material, number, Deposit["status"]]>;
  const initialRows = firstDeposits.map((status, index) => [
    index * 3 + 1, materials[index % materials.length], [7, 5, 9, 24, 6, 3, 4, 13][index] * gramsPerPoint, status,
  ] as const);
  const deposits = [...initialRows, ...priorDeposits].map(([daysAgo, material, grams, status], index): DepositRecord => {
    const availablePoints = collectionPoints.filter((point) => point.materials.includes(material));
    const point = availablePoints[index < firstDeposits.length ? 0 : index % availablePoints.length];
    const base = {
      code: "RV-A" + String(index + 1).padStart(7, "0"),
      material,
      photo: depositPhotoAssets[material],
      estimatedWeightGrams: grams + (status === "accepted" && index >= firstDeposits.length ? 200 : 0),
      ...(status === "accepted" ? { weightGrams: grams } : {}),
      createdAt: ago(daysAgo),
      pointName: point.name,
      method: (["waiting", "accepted", "adjustment"].includes(status) ? "dropoff" : null) as Deposit["method"],
      approvalNote: status === "rejected" ? "Jenis kaca belum sesuai untuk titik ini." : null,
    };
    const item: Deposit = status === "adjustment"
      ? { ...base, status, reason: "Ada botol yang retak atau pecah." }
      : { ...base, status };
    return { item, owner: demoResident.id, point: point.slug, reviewedAt: status === "accepted" ? ago(daysAgo - 1) : undefined };
  }).sort((a, b) => b.item.createdAt.localeCompare(a.item.createdAt));
  const rewards = defaultRewardCatalog.map(({ id, name, cost, stock }) => ({
    id, name, cost, stock, pickup: "Tunjukkan kode saat serah terima.",
  }));
  const [jar, seedling] = defaultRewardCatalog;
  return {
    demoWalletSeeded: true,
    deposits,
    rewards,
    claims: [
      { code: "RW-A00000000001", owner: demoResident.id, rewardId: seedling.id, rewardName: seedling.name, cost: seedling.cost, createdAt: ago(2), fulfilled: false },
      { code: "RW-A00000000003", owner: demoResident.id, rewardId: jar.id, rewardName: jar.name, cost: jar.cost, createdAt: ago(3), fulfilled: true },
      { code: "RW-A00000000002", owner: demoResident.id, rewardId: seedling.id, rewardName: seedling.name, cost: seedling.cost, createdAt: ago(5), fulfilled: true },
    ],
    cashRedemptions: Array.from({ length: 7 }, (_, index) => ({
      ...cashReward, owner: demoResident.id, requestId: "seed-cash-" + index, createdAt: ago(17 + index),
    })),
    cashouts: [2, 1, 3].map((id, index) => ({
      code: "CU-A0000000000" + id,
      owner: demoResident.id,
      requestId: "3991f154-401e-4fd2-93b5-0d41aca2800" + id,
      fromWallet: true, amount: id === 2 ? minimumCashout * 2 : minimumCashout,
      status: "paid", createdAt: ago(7 + index * 7), resolvedAt: ago(6 + index * 7),
    })),
    messages: [
      { id: "pesan-contoh", name: "Warga ReVessel", email: "user@revessel.com", body: "Apakah tutup logam perlu dipisahkan sebelum botol disetor?", sentAt: ago(2) },
    ],
  };
}

export function refreshBuiltInWallet(workspace: Workspace) {
  const residentCredits = workspace.cashRedemptions?.filter(({ owner }) => owner === demoResident.id) ?? [];
  if (workspace.demoWalletSeeded || residentCredits.length) {
    const priorSeed = residentCredits.find(({ requestId }) => requestId === "seed-cash-0");
    if (!priorSeed || residentCredits.some(({ requestId }) => requestId === "seed-cash-6")) return;

    // Add an equal credit and payout to the built-in history, preserving the current balance.
    const sample = seed(Date.parse(priorSeed.createdAt) + 17 * 86_400_000);
    const depositCodes = new Set(workspace.deposits.map(({ item }) => item.code));
    workspace.deposits.push(...sample.deposits.filter(({ item }) =>
      (item.code === "RV-A0000042" || item.code === "RV-A0000043") && !depositCodes.has(item.code),
    ));
    workspace.cashRedemptions!.push(sample.cashRedemptions!.find(({ requestId }) => requestId === "seed-cash-6")!);
    const payout = sample.cashouts!.find(({ code }) => code === "CU-A00000000003")!;
    const entries = workspace.cashouts ??= [];
    if (!entries.some(({ code }) => code === payout.code)) entries.push(payout);
    workspace.deposits.sort((a, b) => b.item.createdAt.localeCompare(a.item.createdAt));
    entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return;
  }

  const sample = seed(Date.now());
  const sampleCodes = new Set(sample.deposits.map(({ item }) => item.code));
  const preservedDeposits = workspace.deposits.filter(({ item, owner, requestId }) =>
    owner !== demoResident.id || requestId || !sampleCodes.has(item.code) || /^RV-A000000[1-8]$/.test(item.code),
  );
  const existingCodes = new Set(preservedDeposits.map(({ item }) => item.code));
  workspace.deposits = [...preservedDeposits, ...sample.deposits.filter(({ item }) => !existingCodes.has(item.code))]
    .sort((a, b) => b.item.createdAt.localeCompare(a.item.createdAt));

  const claims = new Set(workspace.claims.map(({ code }) => code));
  const rewards = new Set(workspace.rewards.map(({ id }) => id));
  workspace.claims.push(...sample.claims.filter(({ code, rewardId }) => !claims.has(code) && rewards.has(rewardId)));
  workspace.cashRedemptions = [...(workspace.cashRedemptions ?? []), ...(sample.cashRedemptions ?? [])];

  const oldCashouts = workspace.cashouts ?? [];
  const seeded = (sample.cashouts ?? []).map((entry) => {
    const prior = oldCashouts.find(({ owner, requestId }) => owner === entry.owner && requestId === entry.requestId);
    return prior ? { ...entry, createdAt: prior.createdAt, resolvedAt: prior.resolvedAt } : entry;
  });
  const seededRequests = new Set(seeded.map(({ requestId }) => requestId));
  workspace.cashouts = [...oldCashouts.filter(({ owner, requestId }) => owner !== demoResident.id || !seededRequests.has(requestId)), ...seeded]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  workspace.demoWalletSeeded = true;
}

export function initialState(): BrowserState {
  const now = Date.now();
  return {
    version: 1,
    workspaceVersion: 2,
    session: null,
    accounts: demoAccounts.map(({ id, name, role, email }) => ({ id, name, role, email, createdAt: new Date(now).toISOString() })),
    workspaces: { demo: seed(now), account: seed(now) },
  };
}
