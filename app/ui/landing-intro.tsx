"use client";

import { useEffect, useRef } from "react";
import styles from "./landing-intro.module.css";

export default function LandingIntro() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const dialog = dialogRef.current;
    const canvas = canvasRef.current;
    if (!root.hasAttribute("data-revessel-intro") || !dialog || !canvas) return;

    let disposed = false;
    let finished = false;
    let finishTimer = 0;
    let stopRendering: (() => void) | undefined;

    function dismiss() {
      if (disposed || finished) return;
      finished = true;
      stopRendering?.();
      root.removeAttribute("data-revessel-intro");
      dialog?.close();
    }

    function revealLanding() {
      if (disposed || finished || finishTimer) return;
      dialog?.setAttribute("data-exiting", "");
      finishTimer = window.setTimeout(dismiss, 420);
    }

    let failSafe = 0;
    const startup = requestAnimationFrame(() => {
      dialog.showModal();
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
      if (dialog.open) {
        root.removeAttribute("data-revessel-intro");
        dialog.close();
      }
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
