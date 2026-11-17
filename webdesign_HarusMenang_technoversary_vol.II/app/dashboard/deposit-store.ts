import { formatGrams } from "@/lib/browser/glass-value";
import { materials, type Material } from "../deposit-options";

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
  "Jenis kaca berbeda dari pengajuan.",
] as const;

export const fulfillmentLabels = {
  dropoff: "Antar sendiri",
  pickup: "Penjemputan diminta",
} as const;

export type FulfillmentMethod = keyof typeof fulfillmentLabels;
export type PickupDetails = { address: string; phone: string };

type CurrentReviewReason = (typeof adjustmentReasons)[number];
type ReviewReason = CurrentReviewReason | "Jenis atau jumlah botol berbeda dari catatan setoran.";
export type Deposit = {
  code: string;
  material: Material;
  quantity?: number;
  estimatedWeightGrams?: number;
  createdAt: string;
  pointName: string;
  method: FulfillmentMethod | null;
  approvalNote: string | null;
  photo?: string;
  weightGrams?: number;
} & (
  | { status: Exclude<keyof typeof statusLabels, "adjustment">; reason?: never }
  | { status: "adjustment"; reason: ReviewReason }
);

export function validMaterial(value: unknown): value is Material {
  return materials.some((material) => material === value);
}
export function validReason(value: unknown): value is CurrentReviewReason {
  return adjustmentReasons.some((reason) => reason === value);
}
export function depositWeightLabel(deposit: Deposit) {
  if (deposit.weightGrams !== undefined) return formatGrams(deposit.weightGrams);
  if (deposit.status !== "accepted" && deposit.estimatedWeightGrams !== undefined) {
    return `Perkiraan ${formatGrams(deposit.estimatedWeightGrams)}`;
  }
  return "Belum ditimbang";
}
