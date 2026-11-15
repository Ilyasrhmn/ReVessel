import Image from "next/image";
import Link from "next/link";
import SiteFrame from "./site-frame";
import Icon from "./interface-icon";
import { articles } from "../content";
import styles from "../pages.module.css";

export default function ArticleDetail({
  article,
}: {
  article: (typeof articles)[number];
}) {
  return (
    <SiteFrame title={article.title} active="/artikel">
      <Link href="/artikel" className={styles.textLink}>
        <Icon kind="article" />
        Semua artikel
      </Link>
      <div className={styles.articleImage}>
        <Image
          src={article.image}
          alt={article.alt}
          fill
          priority
          sizes="(max-width: 760px) 90vw, 1100px"
        />
      </div>
      <article className={styles.prose}>
        {article.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.text}</p>
          </section>
        ))}
        <section className={styles.sources}>
          <h2>Sumber</h2>
          <ul>
            {article.sources.map((source) => (
              <li key={source.href}>
                <a href={source.href}>
                  {source.label}
                  <Icon />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </SiteFrame>
  );
}
