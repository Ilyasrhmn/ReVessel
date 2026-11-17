import { changeState } from "./storage";

export async function sendContactMessage(requestId: string, form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const body = String(form.get("message") ?? "").trim();
  if (form.get("website")) return { success: true };
  if (!name || name.length > 80) return { error: "Masukkan nama hingga 80 karakter." };
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Masukkan alamat email yang valid." };
  if (body.length < 10 || body.length > 2000) return { error: "Tulis pesan sepanjang 10–2.000 karakter." };

  return changeState((state) => {
    const inbox = state.workspaces[state.session?.mode ?? "demo"].messages;
    if (!inbox.some(({ id }) => id === requestId)) {
      inbox.unshift({ id: requestId, name, email, body, sentAt: new Date().toISOString() });
    }
    return { success: true };
  });
}
