import { materials, type AnalyticsPeriod, type CollectionPoint, type Material } from "@/app/deposit-options";
import { collectionDirectory } from "@/app/collection-directory";
import type { Deposit, PickupDetails } from "@/app/dashboard/deposit-store";
import { depositPhotoAssets } from "./deposit-photo-assets";

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
  code: string; owner: string; rewardId: string; requestId?: string; cost: number; createdAt: string; fulfilled: boolean;
};
export type ContactMessage = { id: string; owner?: string; name: string; email: string; subject?: string; body: string; sentAt: string };
export type Workspace = { deposits: DepositRecord[]; rewards: Reward[]; claims: Claim[]; messages: ContactMessage[] };
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

function seed(now: number): Workspace {
  const ago = (days: number) => new Date(now - days * 86400000).toISOString();
  const point = collectionPoints[0];
  const statuses = ["pending_approval", "approved", "waiting", "accepted", "adjustment", "rejected", "cancelled", "accepted"] as const;
  const deposits = statuses.map((status, index): DepositRecord => {
    const base = {
      code: `RV-A000000${index + 1}`,
      material: materials[index % materials.length],
      photo: depositPhotoAssets[materials[index % materials.length]],
      quantity: [7, 5, 9, 24, 6, 3, 4, 13][index],
      createdAt: ago(index * 3 + 1),
      pointName: point.name,
      method: (["waiting", "accepted", "adjustment"].includes(status) ? "dropoff" : null) as Deposit["method"],
      approvalNote: status === "rejected" ? "Jenis kaca belum sesuai untuk titik ini." : null,
    };
    const item: Deposit = status === "adjustment"
      ? { ...base, status, reason: "Ada botol yang retak atau pecah." }
      : { ...base, status };
    return { item, owner: demoResident.id, point: point.slug, reviewedAt: status === "accepted" ? ago(index * 3) : undefined };
  });
  const rewards = [
    { id: "b0d2be6d-f0a3-4151-9e26-92abaa8d9ce1", name: "Wadah kaca pakai ulang", cost: 12, stock: 6, pickup: "Tunjukkan kode saat serah terima." },
    { id: "74f658ef-68c0-4ff8-a31f-d927cb29db03", name: "Bibit tanaman", cost: 8, stock: 10, pickup: "Tunjukkan kode saat serah terima." },
  ];
  return {
    deposits,
    rewards,
    claims: [
      { code: "RW-A00000000001", owner: demoResident.id, rewardId: rewards[1].id, cost: 8, createdAt: ago(2), fulfilled: false },
      { code: "RW-A00000000002", owner: demoResident.id, rewardId: rewards[1].id, cost: 8, createdAt: ago(5), fulfilled: true },
    ],
    messages: [
      { id: "pesan-contoh", name: "Warga ReVessel", email: "user@revessel.com", body: "Apakah tutup logam perlu dipisahkan sebelum botol disetor?", sentAt: ago(2) },
    ],
  };
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
