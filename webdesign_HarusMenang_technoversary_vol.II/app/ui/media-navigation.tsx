"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

type ReadingPosition = { id: string; href: string; y: number };
type TransitionDocument = Document & {
  startViewTransition?: (update: () => Promise<void>) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

const collections = [
  { path: "/galeri", prefix: "gallery" },
  { path: "/artikel", prefix: "article" },
] as const;
type Collection = (typeof collections)[number];

function collectionAt(path: string) {
  return collections.find((collection) => path === collection.path || path.startsWith(collection.path + "/"));
}

function detailId(collection: Collection, path: string) {
  return path.match(new RegExp("^" + collection.path + "/([^/]+)/?$"))?.[1];
}

function positionKey(collection: Collection) { return "revessel." + collection.prefix + ".position"; }

function savedPosition(collection: Collection): ReadingPosition | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(positionKey(collection)) ?? "null");
    if (value && typeof value.id === "string" && typeof value.href === "string" &&
      new RegExp("^" + collection.path + "/?(?:[?#]|$)").test(value.href) && Number.isFinite(value.y) && value.y >= 0) return value;
  } catch {}
  return null;
}

function destination(selector: string) {
  return new Promise<HTMLElement>((resolve, reject) => {
    const observer = new MutationObserver(check);
    const timeout = setTimeout(() => { observer.disconnect(); reject(new Error("Media navigation timed out")); }, 8000);
    function check() {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) return;
      observer.disconnect();
      clearTimeout(timeout);
      resolve(element);
    }
    observer.observe(document.body, { childList: true, subtree: true });
    check();
  });
}

function selectPhoto(collection: Collection, id: string) {
  const photo = document.querySelector<HTMLImageElement>('[data-' + collection.prefix + '-photo="' + CSS.escape(id) + '"]');
  if (photo) photo.dataset.mediaActive = "";
  return photo;
}

async function settle(collection: Collection, element: HTMLElement, y: number, id: string) {
  const image = selectPhoto(collection, id) ?? element.querySelector("img");
  if (image) await image.decode().catch(() => {});
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  window.scrollTo({ top: y, left: 0, behavior: "instant" });
}

export default function MediaNavigation() {
  const router = useRouter();
  const mediaRoute = !!collectionAt(usePathname());

  useEffect(() => {
    if (!mediaRoute) return;
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    return () => { history.scrollRestoration = previous; };
  }, [mediaRoute]);

  useEffect(() => {
    let active = false;

    async function transition(collection: Collection, id: string, update: () => Promise<void>) {
      if (active) return;
      active = true;
      selectPhoto(collection, id);
      try {
        const documentWithTransition = document as TransitionDocument;
        if (documentWithTransition.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
          const animation = documentWithTransition.startViewTransition(update);
          void animation.ready.catch(() => {});
          await animation.finished.catch(() => {});
        } else {
          await update();
        }
      } catch {
        // Navigation errors are handled by the destination route.
      } finally {
        document.querySelectorAll("[data-media-active]").forEach((photo) => photo.removeAttribute("data-media-active"));
        active = false;
      }
    }

    function click(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-gallery-navigation], a[data-article-navigation]") : null;
      if (!link || link.target || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin) return;
      const collection = collectionAt(url.pathname);
      const landing = location.pathname === "/" && link.hasAttribute("data-gallery-landing") && collection?.prefix === "gallery";
      if (!collection || (!landing && collectionAt(location.pathname) !== collection)) return;
      const index = document.querySelector<HTMLElement>("[data-" + collection.prefix + "-index]");
      const detail = document.querySelector<HTMLElement>("[data-" + collection.prefix + "-detail]");
      const currentId = detail?.getAttribute("data-" + collection.prefix + "-detail");
      const id = detailId(collection, url.pathname);
      const returning = !!detail && url.pathname.replace(/\/$/, "") === collection.path;
      if (((!index && !landing) || !id) && !returning) return;
      event.preventDefault();
      if (active) return;

      if ((index || landing) && id) {
        try {
          if (index) sessionStorage.setItem(positionKey(collection), JSON.stringify({ id, href: location.pathname + location.search + location.hash, y: scrollY }));
          else sessionStorage.removeItem(positionKey(collection));
        } catch {}
        void transition(collection, id, async () => {
          const ready = destination('[data-' + collection.prefix + '-detail="' + CSS.escape(id) + '"]');
          router.push(url.pathname, { scroll: false });
          await settle(collection, await ready, 0, id);
          history.replaceState({ ...history.state, revesselMediaOrigin: index ? collection.path : null }, "");
        });
      } else if (detail) {
        const saved = savedPosition(collection);
        const position = saved && saved.id === currentId ? saved : null;
        void transition(collection, currentId!, async () => {
          const ready = destination("[data-" + collection.prefix + "-index]");
          if (position && history.state?.revesselMediaOrigin === collection.path) router.back();
          else router.push(position?.href ?? collection.path + "/", { scroll: false });
          await settle(collection, await ready, position?.y ?? 0, currentId!);
        });
      }
    }

    function popstate(event: PopStateEvent) {
      if (active) return;
      const collection = collectionAt(location.pathname);
      if (!collection) return;
      const detail = document.querySelector<HTMLElement>("[data-" + collection.prefix + "-detail]");
      const currentId = detail?.getAttribute("data-" + collection.prefix + "-detail");
      const index = document.querySelector("[data-" + collection.prefix + "-index]");
      const id = detailId(collection, location.pathname);
      if (detail && location.pathname.replace(/\/$/, "") === collection.path) {
        event.stopImmediatePropagation();
        const position = savedPosition(collection);
        void transition(collection, currentId!, async () => {
          const ready = destination("[data-" + collection.prefix + "-index]");
          window.dispatchEvent(new PopStateEvent("popstate", { state: event.state }));
          await settle(collection, await ready, position && position.id === currentId ? position.y : 0, currentId!);
        });
      } else if (index && id) {
        event.stopImmediatePropagation();
        void transition(collection, id, async () => {
          const ready = destination('[data-' + collection.prefix + '-detail="' + CSS.escape(id) + '"]');
          window.dispatchEvent(new PopStateEvent("popstate", { state: event.state }));
          await settle(collection, await ready, 0, id);
        });
      }
    }

    function prefetch(event: Event) {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-gallery-navigation], a[data-article-navigation]") : null;
      if (link) router.prefetch(link.pathname);
    }

    document.addEventListener("click", click, true);
    document.addEventListener("pointerover", prefetch, { passive: true });
    document.addEventListener("focusin", prefetch);
    window.addEventListener("popstate", popstate, true);
    return () => {
      document.removeEventListener("click", click, true);
      document.removeEventListener("pointerover", prefetch);
      document.removeEventListener("focusin", prefetch);
      window.removeEventListener("popstate", popstate, true);
    };
  }, [router]);

  return null;
}
