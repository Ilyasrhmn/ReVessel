import type { Metadata } from "next";
import ArticleDetail from "../../ui/article-detail";
import { articles } from "../../content";

export const metadata: Metadata = {
  title: "Pakai ulang atau daur ulang? | ReVessel",
};
export default function Page() {
  return <ArticleDetail article={articles[0]} />;
}
