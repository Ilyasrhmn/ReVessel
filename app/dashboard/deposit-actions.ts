"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/server/auth";
import { cancelResidentDeposit, createResidentDeposit, decideDepositApproval, lookupAssignedDeposit, reviewAssignedDeposit, setDepositFulfillment } from "@/lib/server/deposits";
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
    return deposit;
  } catch {
    return { error: serviceError };
  }
}

export async function decideApproval(code: string, form: FormData) {
  try {
    const user = await currentUser();
    if (user?.role !== "reviewer" && user?.role !== "admin") return { error: noAccess };
    const decision = form.get("decision");
    const note = String(form.get("note") ?? "").trim();
    if (!validCode(code) || (decision !== "approve" && decision !== "reject")) {
      return { error: "Pilih keputusan untuk pengajuan ini." };
    }
    if (decision === "reject" && (!note || note.length > 240)) return { error: "Isi alasan penolakan." };
    const deposit = await decideDepositApproval(user.id, code, decision === "reject" ? note : null, user.role === "admin");
    if (!deposit) return { error: "Pengajuan tidak tersedia atau sudah diputuskan." };
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/admin");
    return { deposit };
  } catch {
    return { error: serviceError };
  }
}

export async function chooseFulfillment(code: string, form: FormData) {
  try {
    const user = await currentUser();
    if (user?.role !== "resident") return { error: noAccess };
    const method = form.get("method");
    if (!validCode(code) || (method !== "dropoff" && method !== "pickup")) {
      return { error: "Pilih cara serah terima." };
    }
    const address = String(form.get("address") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim().replace(/[\s()-]/g, "");
    if (method === "pickup" && (address.length < 10 || address.length > 400 || !/^\+?\d{8,15}$/.test(phone) || form.get("share") !== "on")) {
      return { error: "Isi alamat lengkap dan nomor HP yang dapat dihubungi, lalu izinkan berbagi data penjemputan." };
    }
    if (!(await setDepositFulfillment(user.id, code, method, method === "pickup" ? { address, phone } : null))) {
      return { error: "Cara serah terima hanya bisa dipilih satu kali setelah setoran disetujui." };
    }
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/admin");
    return { success: true };
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
