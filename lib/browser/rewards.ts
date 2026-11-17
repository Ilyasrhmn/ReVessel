import { nextCode, scopedChange } from "./deposits";
import { residentRewards } from "./selectors";

const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
export type RewardActionState = { error?: string; message?: string; code?: string };

export function redeemReward(rewardId: string, requestId: string): Promise<RewardActionState> {
  return scopedChange("resident", (data, user) => {
    if (!uuid.test(rewardId) || !uuid.test(requestId)) return { error: "Permintaan penukaran tidak valid." };
    const prior = data.claims.find((claim) => claim.requestId === requestId && claim.owner === user.id);
    if (prior) return prior.rewardId === rewardId ? { code: prior.code } : { error: "Permintaan ini sudah dipakai untuk reward lain." };
    const reward = data.rewards.find(({ id }) => id === rewardId);
    if (!reward?.stock) return { error: "Stok reward habis." };
    if (residentRewards(data, user.id).balance < reward.cost) return { error: "Poinmu belum cukup untuk reward ini." };
    const code = nextCode("RW", data.claims, 6);
    reward.stock -= 1;
    data.claims.unshift({
      owner: user.id, rewardId, requestId, code, cost: reward.cost, createdAt: new Date().toISOString(), fulfilled: false,
    });
    return { code };
  });
}

export function addReward(id: string, form: FormData): Promise<RewardActionState> {
  const name = String(form.get("name") ?? "").trim();
  const pickup = String(form.get("pickup") ?? "").trim();
  const cost = Number(form.get("cost"));
  const stock = Number(form.get("stock"));
  return scopedChange("admin", (data) => {
    if (!uuid.test(id) || !name || name.length > 100 || !pickup || pickup.length > 240 ||
      !Number.isInteger(cost) || cost < 1 || cost > 100000 ||
      !Number.isInteger(stock) || stock < 1 || stock > 10000) {
      return { error: "Lengkapi nama, biaya poin, stok, dan petunjuk pengambilan reward." };
    }
    if (!data.rewards.some((reward) => reward.id === id)) data.rewards.unshift({ id, name, pickup, cost, stock });
    return { message: "Reward sudah tampil di katalog warga." };
  });
}

export function handOverReward(_: RewardActionState, form: FormData): Promise<RewardActionState> {
  const code = String(form.get("code") ?? "").trim().toUpperCase();
  return scopedChange("admin", (data) => {
    const claim = data.claims.find((item) => item.code === code);
    if (!claim) return { error: "Kode penukaran tidak ditemukan." };
    claim.fulfilled = true;
    return { message: "Serah terima reward tercatat." };
  });
}
