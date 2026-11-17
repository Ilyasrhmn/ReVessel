import type { Metadata } from "next";
import ArticleDetail from "../../ui/article-detail";
import { articles } from "../../content";

export const metadata: Metadata = {
  title: "Sebelum botol masuk titik kumpul | ReVessel",
};
export default function Page() {
  return <ArticleDetail article={articles[1]} />;
}
