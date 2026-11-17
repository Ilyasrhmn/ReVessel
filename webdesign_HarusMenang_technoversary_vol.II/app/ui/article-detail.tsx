import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "./site-frame";
import { articles } from "../content";
import shared from "../galeri/gallery-detail.module.css";
import styles from "./article-detail.module.css";

export default function ArticleDetail({ article }: { article: (typeof articles)[number] }) {
  return (
    <>
      <main id="main" data-article-detail={article.slug} tabIndex={-1} className={`${shared.main} ${styles.main} page-shell`}>
        <Link href="/artikel/" className={shared.back} data-article-navigation="">
          <ArrowLeft aria-hidden="true" />Kembali ke artikel
        </Link>
        <article className={styles.layout}>
          <div className={styles.photo}>
            <Image src={article.image} alt={article.alt} fill priority sizes="(max-width:760px) 92vw, 40vw" data-article-photo={article.slug} />
          </div>
          <div className={styles.copy}>
            <h1>{article.title}</h1>
            <div className={styles.sections}>
              {article.sections.map((section) => (
                <section key={section.title}>
                  <h2>{section.title}</h2>
                  <p>{section.text}</p>
                </section>
              ))}
            </div>
            <section className={styles.sources} aria-labelledby="article-sources">
              <h2 id="article-sources">Sumber</h2>
              <ul>
                {article.sources.map((source) => (
                  <li key={source.href}>
                    <a href={source.href} className="link-reveal" target="_blank" rel="noopener noreferrer">{source.label}</a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
