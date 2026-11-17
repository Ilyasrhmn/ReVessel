import type { Metadata } from "next";
import ArticleDetail from "../../ui/article-detail";
import { articles } from "../../content";

export const metadata: Metadata = {
  title: "Jar bekas untuk penyimpanan sehari-hari | ReVessel",
  description: "Jar bekas selai atau madu dapat digunakan untuk menyimpan kancing, gulungan benang, pensil, atau penjepit kayu. Pilih berdasarkan isi yang ingin disimpan agar jar benar-benar terpakai.",
};

export default function Page() {
  return <ArticleDetail article={articles[3]} />;
}
