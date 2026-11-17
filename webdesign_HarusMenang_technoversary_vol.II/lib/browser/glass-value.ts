export const gramsPerPoint = 100;
export const maxWeightGrams = 100_000;
export const pointsForWeight = (grams: number) => Math.floor(grams / gramsPerPoint);
export const validWeight = (grams: number) => Number.isInteger(grams) && grams >= 1 && grams <= maxWeightGrams;

const currency = new Intl.NumberFormat("id-ID");
export const formatGrams = (grams: number) => currency.format(grams) + " g";
