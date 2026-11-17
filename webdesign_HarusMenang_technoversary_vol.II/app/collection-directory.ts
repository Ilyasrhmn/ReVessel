import { materials } from "./deposit-options";

// Material choices are application configuration, separate from the location sources.
export const collectionDirectory = [
  {
    id: "anjasmara",
    materials,
    name: "Bank Sampah Anjasmara 47",
    area: "RW 47 Kentungan, Condongcatur, Sleman",
    coordinates: [-7.755, 110.388],
    contact: "Kalurahan Condongcatur",
    email: "condongcatur@slemankab.go.id",
    source: "https://mediacenter.slemankab.go.id/2026/06/page/38/?print=print-search",
  },
  {
    id: "apel",
    materials,
    name: "Bank Sampah Apel",
    area: "Jl. Cempaka No. 143B, Gempol, Condongcatur, Sleman",
    coordinates: [-7.754, 110.405],
    contact: "Kalurahan Condongcatur",
    email: "condongcatur@slemankab.go.id",
    source: "https://mediacenter.slemankab.go.id/2026/10/05/peringati-hut-ke-16-bank-sampah-apel-tegaskan-komitmen-layani-warga-dan-kelola-lingkungan/",
  },
  {
    id: "mulyo-bareng",
    materials: ["Botol parfum", "Jar kaca"],
    name: "Bank Sampah Mulyo Bareng",
    area: "RW 03 Jatimulyo, Kricak, Kota Yogyakarta",
    coordinates: [-7.774, 110.358],
    contact: "Kelurahan Kricak",
    email: "kricak@jogjakota.go.id",
    source: "https://kricakkel.jogjakota.go.id/detail/index/30186",
  },
] as const;

// Older deposits recorded regions, so retain their IDs without assigning a bank.
const legacyCollectionPointIds = ["contoh-condongcatur", "contoh-kricak"] as const;

export function isKnownCollectionPointId(point: string) {
  return collectionDirectory.some(({ id }) => id === point)
    || legacyCollectionPointIds.some((id) => id === point);
}
