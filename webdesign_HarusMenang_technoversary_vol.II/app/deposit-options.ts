export const materials = ["Botol parfum", "Botol kosmetik", "Jar kaca"] as const;

export const maxBottles = 100;
export const analyticsPeriods = [[7, "7H"], [30, "30H"], [90, "90H"], [365, "12B"]] as const;
export type AnalyticsPeriod = (typeof analyticsPeriods)[number][0];
export type Material = (typeof materials)[number];

export type CollectionPoint = {
  slug: string;
  name: string;
  address: string;
  materials: Material[];
};
