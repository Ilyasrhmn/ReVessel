"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/server/auth";
import { cancelResidentDeposit, createResidentDeposit, lookupAssignedDeposit, reviewAssignedDeposit } from "@/lib/server/deposits";
import { validMaterial, validQuantity, validReason } from "./deposit-store";

const serviceError = "Setoran belum bisa diproses. Coba lagi sebentar.";
const noAccess = "Kamu tidak punya akses untuk melakukan tindakan ini.";
const validCode = (code: string) => /^RV-[A-F0-9]{8}$/.test(code);
const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;

export async function createDeposit(form: FormData) {
  try {
    const user = await currentUser();
    if (user?.role !== "resident") return { error: noAccess };
    const point = form.get("point");
    const material = form.get("material");
    const quantity = Number(form.get("quantity"));
    const requestId = form.get("requestId");
    if (typeof point !== "string" || !validMaterial(material) || !validQuantity(quantity) ||
        typeof requestId !== "string" || !uuid.test(requestId)) {
      return { error: "Pilih titik kumpul dan jenis kaca, lalu masukkan jumlah yang sesuai." };
    }
    const deposit = await createResidentDeposit(user.id, point, material, quantity, requestId);
    if (!deposit) return { error: "Titik kumpul tidak tersedia atau tidak menerima jenis kaca ini." };
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/admin");
    return { deposit };
  } catch {
    return { error: serviceError };
  }
}

export async function cancelDeposit(code: string) {
  try {
    const user = await currentUser();
    if (user?.role !== "resident") return { error: noAccess };
    if (!validCode(code) || !(await cancelResidentDeposit(user.id, code))) {
      return { error: "Setoran tidak ditemukan atau statusnya sudah berubah." };
    }
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch {
    return { error: serviceError };
  }
}

export async function lookupDeposit(code: string) {
  try {
    const user = await currentUser();
    if (user?.role !== "reviewer" && user?.role !== "admin") return { error: noAccess };
    if (!validCode(code)) return { error: "Masukkan kode lengkap seperti RV-XXXXXXXX." };
    const deposit = await lookupAssignedDeposit(user.id, code, user.role === "admin");
    if (!deposit) return { error: user.role === "admin" ? "Kode tidak ditemukan di titik kumpul aktif." : "Kode tidak ditemukan di titik kumpul yang ditugaskan padamu." };
    return { deposit };
  } catch {
    return { error: serviceError };
  }
}

export async function submitReview(code: string, form: FormData) {
  try {
    const user = await currentUser();
    if (user?.role !== "reviewer" && user?.role !== "admin") return { error: noAccess };
    if (!validCode(code)) return { error: "Kode setoran tidak valid." };
    const reason = form.get("reason");
    if (reason && !validReason(reason)) return { error: "Pilih alasan penyesuaian." };
    if (!reason && form.get("verified") !== "on") {
      return { error: "Konfirmasi kondisi, jenis, dan jumlah botol sebelum menerima setoran." };
    }
    const deposit = await reviewAssignedDeposit(user.id, code, validReason(reason) ? reason : null, user.role === "admin");
    if (!deposit) return { error: "Setoran tidak ditemukan atau statusnya sudah berubah." };
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/admin");
    return { deposit };
  } catch {
    return { error: serviceError };
  }
}
