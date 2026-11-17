import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteFrame from "../ui/site-frame";
import { articles } from "../content";
import styles from "../pages.module.css";

export const metadata: Metadata = {
  title: "Artikel | ReVessel",
  description:
    "Panduan memilah botol dan mengenal perbedaan pakai ulang dengan daur ulang.",
};

export default function ArticlesPage() {
  return (
    <SiteFrame title="Artikel">
      <div className={styles.articleList} data-article-index="">
        {articles.map((article) => (
          <Link
            href={`/artikel/${article.slug}`}
            key={article.slug}
            className={styles.articleCard}
            data-article-navigation=""
          >
            <div className={styles.cardImage}>
              <Image
                src={article.image}
                alt={article.alt}
                fill
                sizes="(max-width:760px) 90vw, 45vw"
                data-article-photo={article.slug}
              />
            </div>
            <h2>{article.title}</h2>
          </Link>
        ))}
      </div>
    </SiteFrame>
  );
}
