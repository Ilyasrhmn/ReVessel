"use server";

import { revalidatePath } from "next/cache";
import { saveContactMessage } from "@/lib/server/contact";

export async function sendContactMessage(requestId: string, form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const body = String(form.get("message") ?? "").trim();
  if (form.get("website")) return { success: true };
  if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(requestId)) return { error: "Muat ulang halaman dan coba lagi." };
  if (!name || name.length > 80) return { error: "Masukkan nama hingga 80 karakter." };
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Masukkan alamat email yang valid." };
  if (body.length < 10 || body.length > 2000) return { error: "Tulis pesan sepanjang 10–2.000 karakter." };

  try {
    if (!(await saveContactMessage(requestId, name, email, body))) {
      return { error: "Batas pengiriman tercapai. Coba lagi dalam satu jam." };
    }
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch {
    return { error: "Pesan belum dapat dikonfirmasi. Coba kirim lagi." };
  }
}
