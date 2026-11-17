"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { galleryItems } from "../../gallery-content";
import glass from "../liquid-glass.module.css";
import { moveGlassLight } from "../glass-light";
import styles from "./paper-gallery.module.css";

function PaperPhoto({ item }: { item: (typeof galleryItems)[number] }) {
  return (
    <div className={styles.photo}>
      <div className={styles.image} data-fluid-layer="image">
        <Image src={item.image} alt={item.alt} fill sizes="(max-width: 760px) 90vw, 45vw" data-gallery-photo={item.id} />
      </div>
      <div className={`${styles.hoverCaption} ${glass.surface}`} data-tone="dark" data-fluid-layer="control" onPointerMove={moveGlassLight} aria-hidden="true">
        <span>{item.title}</span><ArrowUpRight />
      </div>
    </div>
  );
}

export default function PaperGallery() {
  const root = useRef<HTMLElement>(null);
  const seed = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = root.current;
    const band = seed.current;
    const placeholder = slot.current;
    const panelWindow = panel.current;
    const viewport = world.current;
    const gallery = content.current;
    if (!section || !band || !placeholder || !panelWindow || !viewport || !gallery) return;

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia(section);
    media.add("(min-width: 761px) and (min-height: 550px) and (prefers-reduced-motion: no-preference)", () => {
      let start = 0;
      let from = { x: 0, y: 0, width: 0, height: 0 };
      let target = { x: 0, y: 0, width: 0, height: 0 };
      let raf = 0;
      let disposed = false;

      function draw() {
        raf = 0;
        const scroll = window.scrollY;
        const progress = gsap.utils.clamp(0, 1, (scroll - start) / Math.max(1, target.y - start));
        const x = gsap.utils.interpolate(from.x, target.x, progress);
        const y = gsap.utils.interpolate(from.y, target.y, progress) - scroll;
        const width = gsap.utils.interpolate(from.width, target.width, progress);
        const height = gsap.utils.interpolate(from.height, target.height, progress);
        panelWindow!.style.transform = "translate3d(" + x + "px," + y + "px,0)";
        panelWindow!.style.width = width + "px";
        panelWindow!.style.height = height + "px";
        viewport!.style.transform = "translate3d(" + -x + "px," + -y + "px,0)";
        gallery!.style.transform = "translate3d(0," + (target.y - scroll) + "px,0)";
      }
      function schedule() {
        if (!raf) raf = requestAnimationFrame(draw);
      }
      function measure() {
        const scroll = window.scrollY;
        const source = band!.getBoundingClientRect();
        const box = placeholder!.getBoundingClientRect();
        start = section!.getBoundingClientRect().top + scroll;
        from = { x: source.left, y: source.top + scroll, width: source.width, height: source.height };
        target = { x: box.left, y: box.top + scroll, width: box.width, height: gallery!.offsetHeight };
        placeholder!.style.height = target.height + "px";
        viewport!.style.width = window.innerWidth + "px";
        draw();
      }

      panelWindow.dataset.expanding = "true";
      band.dataset.placeholder = "true";
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(gallery);
      observer.observe(band);
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", measure);
      const fontsReady = () => { if (!disposed) { measure(); ScrollTrigger.refresh(); } };
      void document.fonts.ready.then(fontsReady);

      const focusGallery = (event: FocusEvent) => {
        if (!(event.target instanceof HTMLElement) || !gallery.contains(event.target) || !event.target.matches(":focus-visible")) return;
        const bounds = event.target.getBoundingClientRect();
        if (bounds.top < 0 || bounds.bottom > innerHeight || window.scrollY < target.y) {
          const contentBounds = gallery.getBoundingClientRect();
          window.scrollTo({ top: target.y + bounds.top - contentBounds.top - 100, behavior: "instant" });
          draw();
        }
      };
      gallery.addEventListener("focusin", focusGallery);

      for (const card of section.querySelectorAll<HTMLElement>("[data-paper-card]")) {
        if (Number(card.dataset.paperCard) % 2 === 0) continue;
        gsap.fromTo(card, { y: 32 }, {
          y: -32, ease: "none",
          scrollTrigger: { trigger: placeholder, start: "top bottom", end: "bottom top", scrub: .35 },
        });
      }

      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        observer.disconnect();
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", measure);
        gallery.removeEventListener("focusin", focusGallery);
        delete panelWindow.dataset.expanding;
        delete band.dataset.placeholder;
        for (const element of [placeholder, panelWindow, viewport, gallery]) element.removeAttribute("style");
      };
    });
    return () => media.revert();
  }, []);

  return (
    <section id="kemungkinan" data-fluid-zone="" ref={root} className={styles.section} aria-labelledby="possibilities-title" tabIndex={-1}>
      <div className={styles.launch}>
        <div ref={seed} className={styles.seed} data-fluid-layer="surface" aria-hidden="true" />
        <h2 id="possibilities-title">Galeri</h2>
      </div>
      <div ref={slot} className={styles.slot} />
      <div ref={panel} className={styles.window} data-paper-window="" data-fluid-zone="">
        <div ref={world} className={styles.world}>
          <div ref={content} className={styles.content}>
            <div className={styles.heading}>
              <h3>Kegiatan ReVessel</h3>
              <Link href="/galeri/" className={styles.allLink}>Lihat semua kegiatan<ArrowUpRight aria-hidden="true" /></Link>
            </div>
            <div className={styles.grid}>
              {galleryItems.slice(0, 6).map((item, index) => (
                <article key={item.id} data-paper-card={index} className={styles.card}>
                  <Link href={"/galeri/" + item.id + "/"} aria-label={"Lihat kegiatan: " + item.title} data-gallery-navigation="" data-gallery-landing="">
                    <PaperPhoto item={item} />
                    <div className={styles.caption}>
                      <h4>{item.title}</h4><ArrowUpRight aria-hidden="true" />
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
