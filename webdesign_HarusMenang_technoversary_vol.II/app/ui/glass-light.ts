type GlassPointer = Pick<
  PointerEvent,
  "pointerType" | "clientX" | "clientY"
> & {
  currentTarget: EventTarget | null;
};

export function moveGlassLight(event: GlassPointer) {
  if (
    event.pointerType !== "mouse" ||
    !(event.currentTarget instanceof HTMLElement) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;

  const surface = event.currentTarget;
  const bounds = surface.getBoundingClientRect();
  surface.style.setProperty(
    "--shine-x",
    `${((event.clientX - bounds.left) / bounds.width) * 100}%`,
  );
  surface.style.setProperty(
    "--shine-y",
    `${((event.clientY - bounds.top) / bounds.height) * 100}%`,
  );
}
