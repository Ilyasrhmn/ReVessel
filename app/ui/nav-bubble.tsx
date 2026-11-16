"use client";

import { useLayoutEffect, useRef } from "react";
import { moveGlassLight } from "./glass-light";
import styles from "./nav-bubble.module.css";

type Box = { x: number; y: number; width: number; height: number };

export default function NavBubble({ active }: { active: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motion = useRef<Animation | null>(null);

  useLayoutEffect(() => {
    const bubble = ref.current;
    const nav = bubble?.parentElement;
    if (!bubble || !nav) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const items = Array.from(
      nav.querySelectorAll<HTMLElement>("[data-nav-item]"),
    );
    const selected = items.find((item) => item.dataset.navItem === active);
    if (!selected) return;
    let placed: Box | undefined;

    function boxFor(element: HTMLElement): Box {
      const rect = element.getBoundingClientRect();
      const origin = nav!.getBoundingClientRect();
      return {
        x: rect.left - origin.left - nav!.clientLeft + nav!.scrollLeft,
        y: rect.top - origin.top - nav!.clientTop + nav!.scrollTop,
        width: rect.width,
        height: rect.height,
      };
    }

    const targetBox = (item: HTMLElement): Box => ({
      x: item.offsetLeft,
      y: item.offsetTop,
      width: item.offsetWidth,
      height: item.offsetHeight,
    });

    function place(item: HTMLElement, animate: boolean) {
      const from = boxFor(bubble!);
      const to = targetBox(item);
      placed = to;
      motion.current?.cancel();
      bubble!.style.width = `${to.width}px`;
      bubble!.style.height = `${to.height}px`;
      bubble!.style.transform = `translate(${to.x}px, ${to.y}px)`;
      bubble!.hidden = false;
      if (!animate || reduced.matches || !from.width || !from.height) return;

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      if (
        Math.abs(dx) + Math.abs(dy) < 1 &&
        Math.abs(to.width - from.width) < 1
      )
        return;
      const stretch = Math.min(Math.abs(dx) * 0.18, to.width * 0.32);
      const stretchBox = {
        x: from.x + dx * 0.62 - (dx < 0 ? stretch : 0),
        y: from.y + dy * 0.62 + to.height * 0.04,
        width: to.width + stretch,
        height: to.height * 0.92,
      };
      const frame = (box: Box) => ({
        transform: `translate(${box.x}px, ${box.y}px) scale(${box.width / to.width}, ${box.height / to.height})`,
      });
      motion.current = bubble!.animate(
        [frame(from), { ...frame(stretchBox), offset: 0.55 }, frame(to)],
        { duration: 330, easing: "cubic-bezier(.22,.72,.25,1)" },
      );
    }

    place(selected, true);

    const measure = () => {
      if (selected) place(selected, false);
    };
    const observer = new ResizeObserver(() => {
      if (!selected || !placed) return;
      const from = placed;
      const to = targetBox(selected);
      if (
        Math.abs(from.width - to.width) > 1 ||
        Math.abs(from.height - to.height) > 1 ||
        Math.abs(from.x - to.x) > 1 ||
        Math.abs(from.y - to.y) > 1
      ) {
        measure();
      }
    });
    observer.observe(nav);
    items.forEach((item) => observer.observe(item));
    window.addEventListener("resize", measure);
    reduced.addEventListener("change", measure);

    nav.addEventListener("pointermove", moveGlassLight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      reduced.removeEventListener("change", measure);
      nav.removeEventListener("pointermove", moveGlassLight);
    };
  }, [active]);

  return (
    <span
      ref={ref}
      className={styles.bubble}
      data-nav-bubble
      aria-hidden="true"
      hidden
    />
  );
}
