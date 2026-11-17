import { materials, maxBottles, type Material } from "../deposit-options";

export const statusLabels = {
  pending_approval: "Menunggu persetujuan",
  approved: "Disetujui",
  rejected: "Pengajuan ditolak",
  waiting: "Menunggu serah terima",
  accepted: "Diterima",
  adjustment: "Perlu penyesuaian",
  cancelled: "Dibatalkan",
} as const;

export const adjustmentReasons = [
  "Ada botol yang retak atau pecah.",
  "Botol masih berisi, kotor, atau basah.",
  "Jenis atau jumlah botol berbeda dari catatan setoran.",
] as const;

export const fulfillmentLabels = {
  dropoff: "Antar sendiri",
  pickup: "Penjemputan diminta",
} as const;

export type FulfillmentMethod = keyof typeof fulfillmentLabels;
export type PickupDetails = { address: string; phone: string };

export type ReviewReason = (typeof adjustmentReasons)[number];
export type Deposit = {
  code: string;
  material: Material;
  quantity: number;
  createdAt: string;
  pointName: string;
  method: FulfillmentMethod | null;
  approvalNote: string | null;
  photo?: string;
} & (
  | { status: Exclude<keyof typeof statusLabels, "adjustment">; reason?: never }
  | { status: "adjustment"; reason: ReviewReason }
);

export function validMaterial(value: unknown): value is Material {
  return materials.some((material) => material === value);
}
export function validReason(value: unknown): value is ReviewReason {
  return adjustmentReasons.some((reason) => reason === value);
}
export function validQuantity(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= maxBottles;
}
