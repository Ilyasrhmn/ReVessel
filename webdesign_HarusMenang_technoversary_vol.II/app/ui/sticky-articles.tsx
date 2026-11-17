"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { articles } from "../content";
import styles from "./sticky-articles.module.css";

export default function StickyArticles() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = root.current;
    if (!section) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia(section);
    media.add("(prefers-reduced-motion: no-preference) and (min-height: 550px)", () => {
      const cards = [...section.querySelectorAll<HTMLElement>("[data-article-card]")];
      const last = cards.at(-1);
      if (!last) return;
      const pin = () => getComputedStyle(cards[0]).top;
      cards.forEach((card, index) => {
        const depth = cards.length - 1 - index;
        if (!depth) return;
        const scrollTrigger = {
          trigger: card, start: () => "top " + pin(),
          endTrigger: last, end: () => "top " + pin(), scrub: true, invalidateOnRefresh: true,
        };
        gsap.to(card, { scale: 1 - .1 * depth, y: -20 * depth, ease: "none", scrollTrigger });
        gsap.to(card.querySelector("[data-article-face]"), { opacity: 0, ease: "none", scrollTrigger: { ...scrollTrigger } });
      });
    });
    return () => media.revert();
  }, []);

  return (
    <section id="artikel" ref={root} className={styles.section} aria-labelledby="articles-title" tabIndex={-1}>
      <div className={styles.layout}>
        <div className={styles.track}>
          {articles.map((article) => (
            <Link key={article.slug} href={"/artikel/" + article.slug} className={styles.card} data-article-card="">
              <div className={styles.face} data-article-face="">
                <h3>{article.title}</h3>
                <div className={styles.photo}>
                  <Image src={article.image} alt={article.alt} fill sizes="(max-width: 760px) 86vw, 35vw" />
                </div>
                <ArrowUpRight className={styles.arrow} aria-hidden="true" />
              </div>
            </Link>
          ))}
          <Link href="/artikel" className={styles.card} data-article-card="">
            <div className={styles.face} data-article-face="">
              <h3>Semua artikel</h3>
              <ArrowUpRight className={styles.moreArrow} aria-hidden="true" />
            </div>
          </Link>
        </div>
        <div className={styles.heading}>
          <h2 id="articles-title">Sebelum kaca<br />berpindah tangan.</h2>
          <span className={styles.label}>Artikel</span>
        </div>
      </div>
    </section>
  );
}
