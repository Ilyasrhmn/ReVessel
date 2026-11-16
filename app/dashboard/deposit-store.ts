import { materials, maxBottles, type Material } from "../deposit-options";

export const statusLabels = {
  waiting: "Menunggu disetor",
  accepted: "Diterima",
  adjustment: "Perlu penyesuaian",
  cancelled: "Dibatalkan",
} as const;

export const adjustmentReasons = [
  "Ada botol yang retak atau pecah.",
  "Botol masih berisi, kotor, atau basah.",
  "Jenis atau jumlah botol berbeda dari catatan setoran.",
] as const;

export type ReviewReason = (typeof adjustmentReasons)[number];
export type Deposit = {
  code: string;
  material: Material;
  quantity: number;
  createdAt: string;
  pointName: string;
} & (
  | { status: "waiting" | "accepted" | "cancelled"; reason?: never }
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
