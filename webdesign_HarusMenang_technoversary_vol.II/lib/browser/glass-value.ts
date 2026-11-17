export const glassRatePerKg = 400;
export const gramsPerPoint = 100;
export const minimumCashout = 50_000;
export const cashReward = { amount: 50_000, cost: 1_250 } as const;
export const maxWeightGrams = 100_000;
export const pointsForWeight = (grams: number) => Math.floor(grams / gramsPerPoint);
export const validWeight = (grams: number) => Number.isInteger(grams) && grams >= 1 && grams <= maxWeightGrams;

const currency = new Intl.NumberFormat("id-ID");
export const rupiah = (amount: number) => "Rp" + currency.format(amount);
export const formatGrams = (grams: number) => currency.format(grams) + " g";
