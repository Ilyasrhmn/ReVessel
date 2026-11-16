import { useEffect, useRef, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

type LandingMotion = {
  pageRef: RefObject<HTMLElement | null>;
  heroRef: RefObject<HTMLElement | null>;
  storyRef: RefObject<HTMLElement | null>;
  storyViewportRef: RefObject<HTMLDivElement | null>;
  chapterCount: number;
  setChapter: (chapter: number) => void;
};

const motionAllowed = "(prefers-reduced-motion: no-preference)";

export function useLandingMotion({
  pageRef,
  heroRef,
  storyRef,
  storyViewportRef,
  chapterCount,
  setChapter,
}: LandingMotion) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const page = pageRef.current;
    const hero = heroRef.current;
    const story = storyRef.current;
    const storyViewport = storyViewportRef.current;
    if (!page || !hero || !story || !storyViewport) return;

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia(page);

    media.add(`${motionAllowed} and (min-height: 34.01rem)`, () => {
      const parallax = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
      });
      parallax
        .to("[data-hero-image]", { yPercent: 12, scale: 1.08 }, 0)
        .to("[data-hero-copy]", { y: -35 }, 0)
        .to("[data-hero-wordmark]", { yPercent: 18 }, 0);

      let activeChapter = -1;
      const updateChapter = (trigger: ScrollTrigger) => {
        const progress = trigger.progress;
        story.style.setProperty("--story-progress", String(progress));
        const index = Math.min(chapterCount - 1, Math.floor(progress * chapterCount));
        if (index !== activeChapter) {
          activeChapter = index;
          setChapter(index);
        }
      };

      ScrollTrigger.create({
        trigger: story,
        start: "top top",
        end: () => `+=${Math.max(1, story.offsetHeight - storyViewport.offsetHeight)}`,
        onUpdate: updateChapter,
        onRefresh: updateChapter,
      });

      return () => story.style.removeProperty("--story-progress");
    });

    media.add(motionAllowed, () => {
      for (const element of page.querySelectorAll("[data-scroll-image]")) {
        gsap.fromTo(element, { scale: 0.95, y: 20 }, {
          scale: 1,
          y: 0,
          transformOrigin: "50% 100%",
          ease: "none",
          scrollTrigger: {
            trigger: element,
            start: "top bottom",
            end: "top 62%",
            scrub: 0.22,
          },
        });
      }

      for (const element of page.querySelectorAll("[data-scroll-copy]")) {
        gsap.fromTo(element, { y: 14, opacity: 0.88 }, {
          y: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: element,
            start: "top bottom",
            end: "top 74%",
            scrub: 0.18,
          },
        });
      }
    });

    media.add(`${motionAllowed} and (hover: hover) and (pointer: fine)`, () => {
      const lenis = new Lenis({
        lerp: 0.14,
        syncTouch: false,
        stopInertiaOnNavigate: true,
      });
      lenisRef.current = lenis;
      lenis.on("scroll", ScrollTrigger.update);

      let scrollTime = 0;
      const tick = (_time: number, delta: number) => {
        scrollTime += Math.min(delta, 40);
        lenis.raf(scrollTime);
      };
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      const cancelInertia = () => {
        if (lenis.isScrolling !== "smooth") return;
        lenis.stop();
        lenis.start();
      };

      const preserveKeyboardScroll = (event: KeyboardEvent) => {
        if (event.defaultPrevented) return;
        if (event.target instanceof Element &&
          event.target.closest("input, textarea, select, [contenteditable], dialog")) return;
        if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) {
          cancelInertia();
        }
      };

      const followAnchor = (event: MouseEvent) => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        if (!(event.target instanceof Element)) return;
        const link = event.target.closest<HTMLAnchorElement>("a[href]");
        if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;

        const url = new URL(link.href);
        if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
        const rawHref = link.getAttribute("href");
        if (!url.hash && rawHref !== "#") {
          if (rawHref === "/") cancelInertia();
          return;
        }

        const destination = url.hash ? document.getElementById(decodeURIComponent(url.hash.slice(1))) : 0;
        if (destination === null) return;
        event.preventDefault();
        cancelInertia();
        if (url.href !== location.href) history.pushState(history.state, "", url.href);
        lenis.scrollTo(destination, {
          lerp: 0.18,
          immediate: url.hash === "#main",
          onComplete: () => {
            if (destination instanceof HTMLElement && destination.hasAttribute("tabindex")) {
              destination.focus({ preventScroll: true });
            }
          },
        });
      };

      document.addEventListener("click", followAnchor, true);
      window.addEventListener("keydown", preserveKeyboardScroll);
      window.addEventListener("popstate", cancelInertia);
      return () => {
        document.removeEventListener("click", followAnchor, true);
        window.removeEventListener("keydown", preserveKeyboardScroll);
        window.removeEventListener("popstate", cancelInertia);
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33);
        lenis.destroy();
        lenisRef.current = null;
      };
    });

    return () => media.revert();
  }, [pageRef, heroRef, storyRef, storyViewportRef, chapterCount, setChapter]);

  return lenisRef;
}
