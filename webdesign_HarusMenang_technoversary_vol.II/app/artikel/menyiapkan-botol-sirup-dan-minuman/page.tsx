import type { Metadata } from "next";
import ArticleDetail from "../../ui/article-detail";
import { articles } from "../../content";

export const metadata: Metadata = {
  title: "Menyiapkan botol sirup dan minuman | ReVessel",
  description: "Kumpulkan botol sirup, jus, atau minuman lain yang sudah kosong. Pisahkan tutup logam dari badan kaca. Untuk tutup atau pengait yang menyatu dengan botol, tanyakan cara penanganannya kepada titik kumpul yang dituju.",
};

export default function Page() {
  return <ArticleDetail article={articles[2]} />;
}
