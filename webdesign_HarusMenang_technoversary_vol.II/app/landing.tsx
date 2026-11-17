"use client";

import Image from "next/image";
import { useRef, useState, type CSSProperties } from "react";
import styles from "./landing.module.css";
import glass from "./ui/liquid-glass.module.css";
import { moveGlassLight } from "./ui/glass-light";
import Icon from "./ui/interface-icon";
import FluidGlassLayer from "./ui/fluid-glass/fluid-glass-layer";
import { useLandingMotion } from "./ui/use-landing-motion";
import BrandLogo from "./ui/brand-logo";
import NewTabLink from "./ui/new-tab-link";
import { BrandPreview } from "./ui/brand-story";
import { useBottleGuide } from "./ui/site-navigation";
import Link from "next/link";
import PaperGallery from "./ui/paper-gallery/paper-gallery";
import StickyArticles from "./ui/sticky-articles";
import { bottleQuestions } from "./bottle-guide";
import CollectionMap from "./ui/collection-map";

const heroPhoto = "/images/glass-study.webp";

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

export default function Landing() {
  const pageRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const storyViewportRef = useRef<HTMLDivElement>(null);
  const openGuide = useBottleGuide();
  const [chapter, setChapter] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const lenisRef = useLandingMotion({
    pageRef,
    heroRef,
    storyRef,
    storyViewportRef,
    chapterCount: chapters.length,
    setChapter,
  });

  function jumpToChapter(index: number) {
    const section = storyRef.current;
    const storyViewport = storyViewportRef.current;
    if (!section || !storyViewport) return;

    const top = window.scrollY + section.getBoundingClientRect().top +
      (section.offsetHeight - storyViewport.offsetHeight) * ((index + 0.25) / chapters.length);

    if (lenisRef.current) {
      lenisRef.current.scrollTo(top, { lerp: 0.18 });
    } else {
      window.scrollTo({
        top,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
    }
  }

  return (
    <main id="main" ref={pageRef} tabIndex={-1}>
      <FluidGlassLayer />
      <section
        id="beranda"
        data-fluid-zone=""
        className={styles.hero}
        ref={heroRef}
        aria-labelledby="hero-title"
        tabIndex={-1}
      >
        <div className={styles.heroImage} data-hero-image="" data-fluid-layer="image">
          <Image
            src={heroPhoto}
            alt="Botol dan jar kaca bening tanpa tutup, diterangi cahaya yang membias"
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className={styles.heroShade} data-fluid-layer="shade" />
        <div className={styles.heroCopy} data-hero-copy="">
          <h1 id="hero-title">
            Pakai ulang
            <br />
            botol kacamu.
          </h1>
          <button
            type="button"
            className={`glass-button ${glass.surface} ${styles.heroButton}`}
            data-fluid-layer="control"
            onPointerMove={moveGlassLight}
            onClick={(event) => openGuide(event.currentTarget)}
          >
            Cek botolmu
          </button>
        </div>
        <div className={styles.wordmark} data-hero-wordmark="" aria-hidden="true">
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
          <h2 id="intro-title" data-scroll-copy="">Botol bekas untuk perajin</h2>
          <p>
            Botol utuh bisa dipakai lagi sebagai wadah. Kaca lainnya dapat
            disalurkan ke pengolah sesuai jenis dan kondisinya.
          </p>
          <NewTabLink
            href="/tentang"
            label="Tentang ReVessel"
            className={`${styles.sectionLink} link-reveal`}
          />
        </div>
        <div className={styles.introImage} data-scroll-image="">
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
        <div ref={storyViewportRef} className={styles.storySticky} data-fluid-zone="story">
          <div className={styles.storyTop}>
            <h2 id="story-title">Perjalanan botol</h2>
          </div>
          <div className={styles.storyVisual} data-fluid-layer="story">
            {chapters.map((item, index) => (
              <div
                key={item.detail}
                className={styles.storyScene}
                data-active={chapter === index}
                aria-hidden={chapter !== index}
              >
                <div className={styles.storyMedia}>
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 760px) 100vw, 70vw"
                  />
                </div>
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
                    data-fluid-layer="control"
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
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.track} data-fluid-layer="surface">
                  <span
                    data-fluid-layer="surface"
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

      <PaperGallery />
      <StickyArticles />

      <section
        id="panduan"
        className={`${styles.faq} page-shell`}
        aria-labelledby="faq-title"
      >
        <div>
          <h2 id="faq-title">Panduan botol</h2>
        </div>
        <div className={styles.faqItems}>
          {bottleQuestions.map(([question, answer], index) => (
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

      <section
        id="titik-kumpul"
        className={`${styles.collectionPoint} page-shell`}
        aria-labelledby="collection-title"
        tabIndex={-1}
      >
        <h2 id="collection-title">Titik kumpul</h2>
        <CollectionMap />
      </section>

      <BrandPreview />


      <footer className={styles.footer} data-fluid-zone="">
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
          data-fluid-layer="control"
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
            <BrandLogo />
          </a>
          <a href="#panduan">Panduan botol</a>
        </div>
      </footer>
    </main>
  );
}
