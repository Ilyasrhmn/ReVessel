export const materials = ["Botol parfum", "Botol kosmetik", "Jar kaca"] as const;

export const maxBottles = 100;
export type Material = (typeof materials)[number];

export type CollectionPoint = {
  slug: string;
  name: string;
  address: string;
  materials: Material[];
};
