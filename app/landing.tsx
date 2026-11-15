"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./landing.module.css";
import GlassLens from "./glass-lens";
import Icon from "./ui/interface-icon";
import Link from "next/link";
import { articles } from "./content";

const chapters = [
  {
    title: "Pilah &\nsiapkan.",
    text: "Kosongkan dan bersihkan botol. Lepaskan tutup atau pompanya.",
    detail: "Pilah & siapkan",
    icon: "bottle" as const,
  },
  {
    title: "Kumpulkan &\nperiksa.",
    text: "Botol diperiksa dan dikelompokkan. Kondisi serta kebutuhan perajin menentukan jalur pakai ulang atau daur ulang.",
    detail: "Kumpulkan & pilah",
    icon: "route" as const,
  },
  {
    title: "Salurkan &\npakai ulang.",
    text: "Botol layak pakai dapat menjadi wadah baru. Kaca yang sesuai kebutuhan pengolah masuk ke jalur daur ulang.",
    detail: "Pakai ulang & olah",
    icon: "spark" as const,
  },
];

const questions = [
  [
    "Kaca seperti apa yang bisa disiapkan?",
    "Mulai dari botol parfum, botol kosmetik, dan jar kaca. Pisahkan dari keramik, cermin, bohlam, dan kaca jendela. Kesesuaian akhir diperiksa saat penerimaan.",
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
    "Apakah saya sudah bisa membuat setoran?",
    "Pendaftaran setoran dan titik kumpul belum dibuka. Saat ini kamu bisa mempelajari alur dan menyiapkan botol melalui checklist di halaman ini.",
  ],
];

export default function Landing() {
  const heroRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuRef = useRef<HTMLDialogElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const dialogTitleRef = useRef<HTMLHeadingElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [chapter, setChapter] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [checks, setChecks] = useState([false, false, false]);
  const [finished, setFinished] = useState(false);
  const [navTone, setNavTone] = useState("dark");

  useEffect(() => {
    if (finished) dialogTitleRef.current?.focus();
  }, [finished]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const nav = navRef.current;
      if (nav) {
        const navBounds = nav.getBoundingClientRect();
        const center = navBounds.top + navBounds.height / 2;
        const hero = heroRef.current?.getBoundingClientRect();
        const story = storyRef.current?.getBoundingClientRect();
        const overHero = hero && hero.top <= center && hero.bottom > center;
        const overStory = story && story.top <= center && story.bottom > center;
        setNavTone(
          overStory || (overHero && window.innerWidth > 760) ? "dark" : "light",
        );
      }
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
      if (storyRef.current) {
        const rect = storyRef.current.getBoundingClientRect();
        const progress = Math.min(
          1,
          Math.max(
            0,
            -rect.top / Math.max(1, rect.height - window.innerHeight),
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
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.getElementById(`chapter-${index}`)?.scrollIntoView();
      return;
    }
    window.scrollTo({
      top:
        window.scrollY +
        section.getBoundingClientRect().top +
        (section.offsetHeight - window.innerHeight) * ((index + 0.25) / 3),
      behavior: "smooth",
    });
  }

  function openGuide(event: React.MouseEvent<HTMLButtonElement>) {
    triggerRef.current = event.currentTarget;
    setFinished(false);
    dialogRef.current?.showModal();
  }

  function moveLight(event: React.PointerEvent<HTMLElement>) {
    if (
      event.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--shine-x",
      `${((event.clientX - bounds.left) / bounds.width) * 100}%`,
    );
    event.currentTarget.style.setProperty(
      "--shine-y",
      `${((event.clientY - bounds.top) / bounds.height) * 100}%`,
    );
  }

  return (
    <>
      <GlassLens />
      <a className={styles.skip} href="#main">
        Lewati navigasi
      </a>
      <header className={styles.header}>
        <a
          href="#"
          className={styles.brand}
          aria-label="ReVessel, kembali ke atas"
        >
          ReVessel
        </a>
        <nav
          ref={navRef}
          onPointerMove={moveLight}
          data-tone={navTone}
          className={`${styles.nav} ${styles.liquid} glass-surface`}
          aria-label="Navigasi utama"
        >
          <a href="#perjalanan">
            <Icon kind="route" />
            <span>Perjalanan</span>
          </a>
          <button
            ref={menuTriggerRef}
            className={styles.menuButton}
            aria-haspopup="dialog"
            aria-controls="site-menu"
            onClick={() => menuRef.current?.showModal()}
          >
            <Icon kind="plus" />
            <span>Menu</span>
          </button>
          <button onClick={openGuide}>
            <Icon kind="bottle" />
            <span>Siapkan botol</span>
            <Icon />
          </button>
        </nav>
      </header>

      <main id="main">
        <section
          className={styles.hero}
          ref={heroRef}
          aria-labelledby="hero-title"
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
              className={`glass-button ${styles.liquid} ${styles.heroButton}`}
              onPointerMove={moveLight}
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
        >
          <div>
            <h2 id="intro-title">
              Dari botol bekas
              <br />
              ke tangan perajin.
            </h2>
            <div className={styles.introBottom}>
              <p>
                ReVessel mempertemukan botol kaca bekas, titik kumpul, dan
                perajin.
              </p>
              <a
                href="#perjalanan"
                className={styles.roundLink}
                aria-label="Lihat perjalanan botol"
              >
                <Icon kind="down" />
              </a>
            </div>
            <Link href="/tentang" className={styles.sectionLink}>
              <Icon kind="about" />
              Tentang ReVessel
              <Icon />
            </Link>
          </div>
        </section>

        <section
          id="perjalanan"
          ref={storyRef}
          className={styles.story}
          data-chapter={chapter}
          aria-labelledby="story-title"
        >
          <div className={styles.storySticky}>
            <div className={styles.storyTop}>
              <h2 id="story-title">Perjalanan botol</h2>
            </div>
            <div className={styles.storyVisual}>
              <Image
                src="/images/glass-study.webp"
                alt="Studi material botol kaca bening untuk pakai ulang"
                fill
                sizes="(max-width: 760px) 100vw, 65vw"
              />
              <div className={styles.visualFrame} aria-hidden="true" />
            </div>
            <div className={styles.chapters}>
              {chapters.map((item, index) => (
                <article
                  id={`chapter-${index}`}
                  key={item.detail}
                  className={`${styles.chapter} ${chapter === index ? styles.chapterActive : ""}`}
                >
                  <h3>
                    <Icon kind={item.icon} />
                    {item.title}
                  </h3>
                  <p>{item.text}</p>
                  {index === 0 && (
                    <button
                      className={`glass-button ${styles.liquid} ${styles.storyButton}`}
                      onPointerMove={moveLight}
                      data-tone="dark"
                      onClick={openGuide}
                    >
                      Buka panduan botol
                      <Icon />
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
        >
          <div className={`${styles.galleryHeading} page-shell`}>
            <h2 id="possibilities-title">Botol & jar kaca.</h2>
            <Link href="/galeri" className={styles.sectionLink}>
              <Icon kind="gallery" />
              Lihat galeri
              <Icon />
            </Link>
          </div>
          <div
            className={styles.gallery}
            tabIndex={0}
            role="region"
            aria-label="Galeri material kaca, geser untuk melihat foto berikutnya"
          >
            <figure className={styles.galleryPrimary}>
              <div className={styles.galleryImage}>
                <Image
                  src="/images/amber-study.webp"
                  alt="Botol kaca amber dengan pipet di bawah cahaya matahari"
                  fill
                  sizes="(max-width: 760px) 86vw, 54vw"
                />
              </div>
              <figcaption>
                <span>Botol amber</span>
                <span>
                  <Icon kind="bottle" />
                </span>
              </figcaption>
            </figure>
            <figure className={styles.gallerySecondary}>
              <div className={styles.galleryImage}>
                <Image
                  src="/images/glass-study.webp"
                  alt="Beragam bentuk botol dan jar kaca bening"
                  fill
                  sizes="(max-width: 760px) 86vw, 38vw"
                />
              </div>
              <figcaption>
                <span>Botol & jar bening</span>
                <span>
                  <Icon kind="spark" />
                </span>
              </figcaption>
            </figure>
          </div>
        </section>

        <section
          className={`${styles.articles} page-shell`}
          aria-labelledby="articles-title"
        >
          <div className={styles.sectionHeading}>
            <h2 id="articles-title">Artikel.</h2>
            <Link href="/artikel" className={styles.sectionLink}>
              Semua artikel
              <Icon />
            </Link>
          </div>
          <div className={styles.articleRows}>
            {articles.map((article) => (
              <Link key={article.slug} href={`/artikel/${article.slug}`}>
                <Icon kind="article" />
                <h3>{article.title}</h3>
                <Icon />
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
            <h2 id="faq-title">Panduan botol.</h2>
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
                    <Icon kind={openFaq === index ? "close" : "plus"} />
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
            <span>Mulai dari yang ada di rumah.</span>
            <a href="#" aria-label="Kembali ke atas">
              Kembali ke atas
              <Icon kind="down" />
            </a>
          </div>
          <h2>
            Botolmu,
            <br />
            bab berikutnya.
          </h2>
          <button
            className={`glass-button ${styles.liquid} ${styles.footerButton}`}
            onPointerMove={moveLight}
            onClick={openGuide}
          >
            Siapkan botolmu
            <Icon />
          </button>
          <nav className={styles.footerLinks} aria-label="Halaman situs">
            <Link href="/tentang">
              <Icon kind="about" />
              Tentang
            </Link>
            <Link href="/galeri">
              <Icon kind="gallery" />
              Galeri
            </Link>
            <Link href="/artikel">
              <Icon kind="article" />
              Artikel
            </Link>
            <Link href="/kontak">
              <Icon kind="contact" />
              Kontak
            </Link>
          </nav>
          <div className={styles.footerBottom}>
            <a href="#" className={styles.brand}>
              ReVessel
            </a>
            <p>Wadah lama. Kemungkinan baru.</p>
            <a href="#panduan">
              Panduan botol
              <Icon />
            </a>
          </div>
        </footer>
      </main>

      <dialog
        id="site-menu"
        ref={menuRef}
        className={`${styles.dialog} ${styles.siteMenu}`}
        aria-labelledby="menu-title"
        onClose={() => menuTriggerRef.current?.focus()}
      >
        <button
          className={styles.dialogClose}
          aria-label="Tutup menu"
          onClick={() => menuRef.current?.close()}
        >
          <Icon kind="close" />
        </button>
        <h2 id="menu-title">Menu</h2>
        <nav aria-label="Halaman ReVessel">
          {[
            { href: "/", label: "Home", icon: "home" as const },
            { href: "/tentang", label: "Tentang", icon: "about" as const },
            { href: "/galeri", label: "Galeri", icon: "gallery" as const },
            { href: "/artikel", label: "Artikel", icon: "article" as const },
            { href: "/kontak", label: "Kontak", icon: "contact" as const },
          ].map((item) => (
            <Link
              href={item.href}
              key={item.href}
              onClick={() => menuRef.current?.close()}
            >
              <Icon kind={item.icon} />
              <span>{item.label}</span>
              <Icon />
            </Link>
          ))}
        </nav>
      </dialog>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="guide-title"
        onClose={() => triggerRef.current?.focus()}
      >
        <button
          className={styles.dialogClose}
          aria-label="Tutup panduan"
          onClick={() => dialogRef.current?.close()}
        >
          <Icon kind="close" />
        </button>
        <Icon kind="bottle" />
        <h2 id="guide-title" ref={dialogTitleRef} tabIndex={-1}>
          {finished ? "Botolmu siap dipilah." : "Siapkan botolmu."}
        </h2>
        {finished ? (
          <>
            <p>Pendaftaran setoran belum dibuka.</p>
            <button
              className={styles.solidButton}
              onClick={() => dialogRef.current?.close()}
            >
              Selesai
              <Icon kind="check" />
            </button>
          </>
        ) : (
          <>
            <div className={styles.checklist}>
              {[
                "Botol utuh, tanpa retak atau gompal",
                "Sudah kosong, bersih, dan kering",
                "Tutup atau pompa sudah dilepas",
              ].map((text, index) => (
                <label key={text}>
                  <input
                    type="checkbox"
                    checked={checks[index]}
                    onChange={() =>
                      setChecks(
                        checks.map((checked, i) =>
                          i === index ? !checked : checked,
                        ),
                      )
                    }
                  />
                  <span>{text}</span>
                </label>
              ))}
            </div>
            <button
              className={styles.solidButton}
              disabled={!checks.every(Boolean)}
              onClick={() => setFinished(true)}
            >
              Checklist selesai
              <Icon />
            </button>
          </>
        )}
      </dialog>
    </>
  );
}
