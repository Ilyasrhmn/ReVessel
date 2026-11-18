"use client";

import { useLayoutEffect, useRef } from "react";
import styles from "./landing-intro.module.css";

export default function LandingIntro() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const canvas = canvasRef.current;
    if (!dialog || !canvas || location.hash) return;
    if (matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active), (prefers-reduced-transparency: reduce)").matches) return;
    try {
      if (sessionStorage.getItem("revessel-intro")) return;
    } catch {
      return;
    }

    let disposed = false;
    let finished = false;
    let finishTimer = 0;
    let stopRendering: (() => void) | undefined;

    function dismiss() {
      if (disposed || finished) return;
      finished = true;
      stopRendering?.();
      dialog?.close();
    }

    function revealLanding() {
      if (disposed || finished || finishTimer) return;
      dialog?.setAttribute("data-exiting", "");
      finishTimer = window.setTimeout(dismiss, 420);
    }

    let failSafe = 0;
    dialog.showModal();
    const startup = requestAnimationFrame(() => {
      try { sessionStorage.setItem("revessel-intro", "1"); } catch {}
      failSafe = window.setTimeout(dismiss, 4100);
      import("./liquid-glass-logo-reveal").then(({ startLogoReveal }) => {
        if (!disposed && !finished) stopRendering = startLogoReveal(canvas, revealLanding);
      }).catch(revealLanding);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(startup);
      stopRendering?.();
      window.clearTimeout(failSafe);
      window.clearTimeout(finishTimer);
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      className={styles.intro}
      ref={dialogRef}
      aria-label="Pembuka ReVessel"
      data-lenis-prevent=""
      onCancel={(event) => event.preventDefault()}
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    </dialog>
  );
}
