"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/server/auth";
import { fulfillReward, publishReward, redeemResidentReward } from "@/lib/server/rewards";

const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;

export type RewardActionState = { error?: string; message?: string; code?: string };

function refreshRewards() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/admin");
}

export async function redeemReward(rewardId: string, requestId: string): Promise<RewardActionState> {
  try {
    const user = await currentUser();
    if (user?.role !== "resident") return { error: "Hanya akun warga yang dapat menukar poin." };
    if (!uuid.test(rewardId) || !uuid.test(requestId)) return { error: "Permintaan penukaran tidak valid." };
    const result = await redeemResidentReward(user.id, rewardId, requestId);
    if (result.code) refreshRewards();
    return result;
  } catch {
    return { error: "Penukaran belum dapat dikonfirmasi. Coba lagi untuk memeriksa hasilnya." };
  }
}

export async function addReward(id: string, form: FormData): Promise<RewardActionState> {
  try {
    if ((await currentUser())?.role !== "admin") return { error: "Akses ini khusus admin." };
    const name = String(form.get("name") ?? "").trim();
    const pickup = String(form.get("pickup") ?? "").trim();
    const cost = Number(form.get("cost"));
    const stock = Number(form.get("stock"));
    if (!uuid.test(id) || !name || name.length > 100 || !pickup || pickup.length > 240 ||
      !Number.isInteger(cost) || cost < 1 || cost > 100000 ||
      !Number.isInteger(stock) || stock < 1 || stock > 10000) {
      return { error: "Lengkapi nama, biaya poin, stok, dan petunjuk pengambilan reward." };
    }
    await publishReward({ id, name, pickup, cost, stock });
    refreshRewards();
    return { message: "Reward sudah tampil di katalog warga." };
  } catch {
    return { error: "Reward belum dapat dikonfirmasi. Coba simpan lagi." };
  }
}

export async function handOverReward(_: RewardActionState, form: FormData): Promise<RewardActionState> {
  try {
    if ((await currentUser())?.role !== "admin") return { error: "Akses ini khusus admin." };
    const code = String(form.get("code") ?? "").trim().toUpperCase();
    if (!/^RW-[A-F0-9]{12}$/.test(code) || !(await fulfillReward(code))) {
      return { error: "Kode penukaran tidak ditemukan." };
    }
    refreshRewards();
    return { message: "Serah terima reward tercatat." };
  } catch {
    return { error: "Serah terima belum dapat dikonfirmasi. Coba lagi." };
  }
}
