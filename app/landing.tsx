"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./landing.module.css";
import glass from "./ui/liquid-glass.module.css";
import { moveGlassLight } from "./ui/glass-light";
import Icon from "./ui/interface-icon";
import { useBottleGuide } from "./ui/site-navigation";
import Link from "next/link";
import { articles } from "./content";

const chapters = [
  {
    title: "Pilah &\nsiapkan",
    text: "Kosongkan dan bersihkan botol. Lepaskan tutup atau pompanya.",
    detail: "Pilah & siapkan",
    image: "/images/siapkan-botol.webp",
    alt: "Tangan membilas botol kaca bekas setelah pompa dilepas",
  },
  {
    title: "Kumpulkan &\nperiksa",
    text: "Cek kondisi botol di titik kumpul. Pisahkan botol utuh dari kaca yang perlu diolah.",
    detail: "Kumpulkan & pilah",
    image: "/images/periksa-botol.webp",
    alt: "Botol kaca diperiksa di meja sortir",
  },
  {
    title: "Salurkan &\npakai ulang",
    text: "Botol layak pakai dapat menjadi wadah baru. Kaca yang sesuai kebutuhan pengolah masuk ke jalur daur ulang.",
    detail: "Pakai ulang & olah",
    image: "/images/pakai-ulang-botol.webp",
    alt: "Perajin memasang batang pewangi pada botol kaca bekas",
  },
];

const questions = [
  [
    "Kaca seperti apa yang bisa disiapkan?",
    "Siapkan botol parfum, botol kosmetik, dan jar kaca. Pisahkan keramik, cermin, bohlam, dan kaca jendela. Cek jenis kaca yang diterima oleh titik kumpul.",
  ],
  [
    "Bagaimana kalau botol retak atau pecah?",
    "Pisahkan dari botol utuh. Bungkus dengan bahan pelindung dan beri tanda kaca pecah. Jangan memasukkannya ke jalur pakai ulang; penerimaan daur ulang bergantung pada pengolah.",
  ],
  [
    "Apakah semua botol akan menjadi produk baru?",
    "Jalurnya bergantung pada kondisi, kebersihan, jenis kaca, serta kebutuhan penerima. Botol utuh dapat dipakai ulang, sementara material yang sesuai dapat didaur ulang.",
  ],
  [
    "Apa yang perlu ditanyakan ke titik kumpul?",
    "Tanyakan jenis kaca yang diterima, cara membungkusnya, dan waktu penyerahan.",
  ],
];

export default function Landing() {
  const heroRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const storyViewportRef = useRef<HTMLDivElement>(null);
  const openGuide = useBottleGuide();
  const [chapter, setChapter] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      if (heroRef.current) {
        const progress = Math.min(
          1,
          Math.max(
            0,
            -heroRef.current.getBoundingClientRect().top / window.innerHeight,
          ),
        );
        heroRef.current.style.setProperty(
          "--hero-progress",
          reduced.matches ? "0" : String(progress),
        );
      }
      const storyViewport = storyViewportRef.current;
      if (storyRef.current && storyViewport) {
        const rect = storyRef.current.getBoundingClientRect();
        const progress = Math.min(
          1,
          Math.max(
            0,
            -rect.top / Math.max(1, rect.height - storyViewport.offsetHeight),
          ),
        );
        storyRef.current.style.setProperty(
          "--story-progress",
          String(reduced.matches ? 0 : progress),
        );
        setChapter(Math.min(2, Math.floor(progress * 3)));
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduced.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduced.removeEventListener("change", schedule);
    };
  }, []);

  function jumpToChapter(index: number) {
    const section = storyRef.current;
    const storyViewport = storyViewportRef.current;
    if (!section || !storyViewport) return;
    window.scrollTo({
      top:
        window.scrollY +
        section.getBoundingClientRect().top +
        (section.offsetHeight - storyViewport.offsetHeight) *
          ((index + 0.25) / 3),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  return (
    <main id="main" tabIndex={-1}>
      <section
        id="beranda"
        className={styles.hero}
        ref={heroRef}
        aria-labelledby="hero-title"
        tabIndex={-1}
      >
        <div className={styles.heroImage}>
          <Image
            src="/images/glass-study.webp"
            alt="Botol dan jar kaca bening tanpa tutup, diterangi cahaya yang membias"
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className={styles.heroShade} />
        <div className={styles.heroCopy}>
          <h1 id="hero-title">
            Pakai ulang
            <br />
            botol kacamu.
          </h1>
          <a
            className={`glass-button ${glass.surface} ${styles.heroButton}`}
            onPointerMove={moveGlassLight}
            href="#perjalanan"
          >
            Lihat alur botol
            <Icon kind="down" />
          </a>
        </div>
        <div className={styles.wordmark} aria-hidden="true">
          ReVessel
        </div>
      </section>

      <section
        id="tentang"
        className={`${styles.intro} page-shell`}
        aria-labelledby="intro-title"
        tabIndex={-1}
      >
        <div className={styles.introCopy}>
          <h2 id="intro-title">Botol bekas untuk perajin</h2>
          <p>
            Botol utuh bisa dipakai lagi sebagai wadah. Kaca lainnya dapat
            disalurkan ke pengolah sesuai jenis dan kondisinya.
          </p>
          <Link href="/tentang" className={`${styles.sectionLink} link-reveal`}>
            <span>Tentang ReVessel</span>
          </Link>
        </div>
        <div className={styles.introImage}>
          <Image
            src="/images/perajin-kaca.webp"
            alt="Perajin memeriksa botol kaca di meja kerja"
            fill
            sizes="(max-width: 760px) 90vw, 45vw"
          />
        </div>
      </section>

      <section
        id="perjalanan"
        ref={storyRef}
        className={styles.story}
        data-chapter={chapter}
        aria-labelledby="story-title"
        tabIndex={-1}
      >
        <div ref={storyViewportRef} className={styles.storySticky}>
          <div className={styles.storyTop}>
            <h2 id="story-title">Perjalanan botol</h2>
          </div>
          <div className={styles.storyVisual}>
            {chapters.map((item, index) => (
              <div
                key={item.detail}
                className={styles.storyScene}
                data-active={chapter === index}
                aria-hidden={chapter !== index}
              >
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 760px) 100vw, 70vw"
                />
              </div>
            ))}
          </div>
          <div className={styles.chapters}>
            {chapters.map((item, index) => (
              <article
                id={`chapter-${index}`}
                key={item.detail}
                className={`${styles.chapter} ${chapter === index ? styles.chapterActive : ""}`}
              >
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                {index === 0 && (
                  <button
                    className={`glass-button ${glass.surface} ${styles.storyButton}`}
                    onPointerMove={moveGlassLight}
                    data-tone="dark"
                    onClick={(event) => openGuide(event.currentTarget)}
                  >
                    Siapkan botol
                    <Icon kind="bottle" />
                  </button>
                )}
              </article>
            ))}
          </div>
          <nav
            className={styles.chapterNav}
            aria-label="Tahap perjalanan botol"
          >
            {chapters.map((item, index) => (
              <button
                key={item.detail}
                aria-label={`Tahap ${index + 1}: ${item.detail}`}
                aria-current={index === chapter ? "step" : undefined}
                onClick={() => jumpToChapter(index)}
              >
                <span>0{index + 1}</span>
                <span className={styles.track}>
                  <span
                    style={
                      {
                        "--fill":
                          chapter > index
                            ? 1
                            : chapter < index
                              ? 0
                              : "clamp(0, calc(var(--story-progress) * 3 - " +
                                index +
                                "), 1)",
                      } as CSSProperties
                    }
                  />
                </span>
              </button>
            ))}
          </nav>
        </div>
      </section>

      <section
        id="kemungkinan"
        className={styles.possibilities}
        aria-labelledby="possibilities-title"
        tabIndex={-1}
      >
        <div className={`${styles.galleryHeading} page-shell`}>
          <h2 id="possibilities-title">Botol & jar kaca</h2>
          <Link href="/galeri" className={`${styles.sectionLink} link-reveal`}>
            <span>Lihat galeri</span>
          </Link>
        </div>
        <div
          className={styles.gallery}
          data-glass-scroll=""
          tabIndex={0}
          role="region"
          aria-label="Galeri material kaca, geser untuk melihat foto berikutnya"
        >
          <figure className={styles.galleryPrimary}>
            <Link href="/galeri#botol-amber" className={styles.galleryLink}>
              <div className={styles.galleryImage}>
                <Image
                  src="/images/amber-study.webp"
                  alt=""
                  fill
                  sizes="(max-width: 760px) 86vw, 54vw"
                />
              </div>
              <span>Botol amber</span>
            </Link>
          </figure>
          <figure className={styles.gallerySecondary}>
            <Link href="/galeri#jar-bening" className={styles.galleryLink}>
              <div className={styles.galleryImage}>
                <Image
                  src="/images/galeri-kaca-bening.webp"
                  alt=""
                  fill
                  sizes="(max-width: 760px) 86vw, 38vw"
                />
              </div>
              <span>Botol & jar bening</span>
            </Link>
          </figure>
        </div>
      </section>

      <section
        id="artikel"
        className={`${styles.articles} page-shell`}
        aria-labelledby="articles-title"
        tabIndex={-1}
      >
        <div className={styles.sectionHeading}>
          <h2 id="articles-title">Artikel</h2>
          <Link href="/artikel" className={styles.sectionLink}>
            <span>Semua artikel</span>
          </Link>
        </div>
        <div className={styles.articleRows}>
          {articles.map((article) => (
            <Link key={article.slug} href={`/artikel/${article.slug}`}>
              <h3>{article.title}</h3>
            </Link>
          ))}
        </div>
      </section>

      <section
        id="panduan"
        className={`${styles.faq} page-shell`}
        aria-labelledby="faq-title"
      >
        <div>
          <h2 id="faq-title">Panduan botol</h2>
        </div>
        <div className={styles.faqItems}>
          {questions.map(([question, answer], index) => (
            <div key={question} className={styles.faqItem}>
              <h3>
                <button
                  aria-expanded={openFaq === index}
                  aria-controls={`answer-${index}`}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  {question}
                  <Icon kind={openFaq === index ? "minus" : "plus"} />
                </button>
              </h3>
              <div
                id={`answer-${index}`}
                className={`${styles.answer} ${openFaq === index ? styles.answerOpen : ""}`}
                inert={openFaq !== index ? true : undefined}
              >
                <div>
                  <p>{answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <a href="#" aria-label="Kembali ke atas">
            Kembali ke atas
            <Icon kind="down" />
          </a>
        </div>
        <h2>
          Cek botol
          <br />
          sebelum disetor
        </h2>
        <button
          className={`glass-button ${glass.surface} ${styles.footerButton}`}
          onPointerMove={moveGlassLight}
          onClick={(event) => openGuide(event.currentTarget)}
        >
          Siapkan botol
          <Icon kind="bottle" />
        </button>
        <nav className={styles.footerLinks} aria-label="Halaman situs">
          <Link href="/tentang">
            Tentang
          </Link>
          <Link href="/galeri">
            Galeri
          </Link>
          <Link href="/artikel">
            Artikel
          </Link>
          <Link href="/kontak">
            Kontak
          </Link>
        </nav>
        <div className={styles.footerBottom}>
          <a href="#beranda" className={styles.brand}>
            ReVessel
          </a>
          <a href="#panduan">Panduan botol</a>
        </div>
      </footer>
    </main>
  );
}
