"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import { paintFluidScene } from "./paint-fluid-scene";
import styles from "./fluid-glass-layer.module.css";

const FluidGlass = dynamic(() => import("./FluidGlass"), { ssr: false });
const pointerMedia = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)";
const shapes = ["lens", "prism", "torus", "cube", "pill", "diamond"];
const aperture = 150;

function subscribeToPointerMedia(onChange) {
  const media = window.matchMedia(pointerMedia);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function canAnimate() {
  return window.matchMedia(pointerMedia).matches;
}

function staticSnapshot() {
  return false;
}

export default function FluidGlassLayer() {
  const enabled = useSyncExternalStore(subscribeToPointerMedia, canAnimate, staticSnapshot);
  const layerRef = useRef(null);
  const zoneRef = useRef(null);
  const backdropFrameRef = useRef(null);
  const paintBackdrop = useCallback((context, viewport) => {
    if (zoneRef.current) paintFluidScene(context, viewport, zoneRef.current);
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!enabled || !layer) return;

    let pointerX = window.innerWidth * 0.72;
    let pointerY = window.innerHeight * 0.43;
    let insideWindow = true;
    let visible = false;
    let frame = 0;
    let targetX;
    let targetY;
    const follow = { duration: 0.22, ease: "power3.out", onUpdate: () => backdropFrameRef.current?.() };
    const xTo = gsap.quickTo(layer, "x", follow);
    const yTo = gsap.quickTo(layer, "y", follow);

    function update() {
      frame = 0;
      const hit = insideWindow ? document.elementFromPoint(pointerX, pointerY) : null;
      const zone = hit?.closest("[data-fluid-zone]");
      const shouldShow = Boolean(zone);
      if (zone) zoneRef.current = zone;
      if (shouldShow !== visible) {
        visible = shouldShow;
        layer.dataset.fluidVisible = String(visible);
        if (!visible) {
          targetX = undefined;
          targetY = undefined;
          return;
        }
      }
      if (!visible) return;

      const x = pointerX - aperture;
      const y = pointerY - aperture;
      if (x !== targetX) xTo(x, targetX === undefined ? x : undefined);
      if (y !== targetY) yTo(y, targetY === undefined ? y : undefined);
      targetX = x;
      targetY = y;
      backdropFrameRef.current?.();
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    function trackPointer(event) {
      if (event.pointerType !== "mouse") return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      insideWindow = true;
      schedule();
    }

    function hideOnLeave() {
      insideWindow = false;
      schedule();
    }

    gsap.set(layer, { x: pointerX - aperture, y: pointerY - aperture });
    schedule();
    window.addEventListener("pointermove", trackPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", hideOnLeave);
    window.addEventListener("blur", hideOnLeave);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("load", schedule, true);
    document.addEventListener("transitionend", schedule);

    return () => {
      cancelAnimationFrame(frame);
      xTo.tween.kill();
      yTo.tween.kill();
      window.removeEventListener("pointermove", trackPointer);
      document.documentElement.removeEventListener("pointerleave", hideOnLeave);
      window.removeEventListener("blur", hideOnLeave);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("load", schedule, true);
      document.removeEventListener("transitionend", schedule);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={layerRef}
      className={styles.layer}
      data-fluid-lens=""
      data-fluid-visible="false"
      aria-hidden="true"
    >
      <FluidGlass
        text=""
        shape="lens"
        shapes={shapes}
        size={144}
        refraction={1}
        dispersion={0.35}
        interaction="static"
        shadow={0}
        elevation={0.4}
        reflection={1.1}
        wobble={0.3}
        morphOnClick
        idle={false}
        spin={0}
        intro={false}
        maxDevicePixelRatio={1.25}
        paintBackdrop={paintBackdrop}
        backdropFrameRef={backdropFrameRef}
      />
    </div>
  );
}
