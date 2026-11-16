"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { LatLngTuple, Map as LeafletMap } from "leaflet";
import { collectionDirectory } from "../collection-directory";
import "leaflet/dist/leaflet.css";
import styles from "./collection-map.module.css";

type DirectoryEntry = (typeof collectionDirectory)[number];
type MapState = "loading" | "ready" | "unavailable";

const house = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7M5 9v11h14V9m-9 11v-7h4v7"/></svg>';

function popupContent(point: DirectoryEntry) {
  const content = document.createElement("div");
  content.className = styles.popupContent;
  const name = document.createElement("strong");
  const area = document.createElement("p");
  const contact = document.createElement("p");
  name.textContent = point.name;
  area.textContent = point.area;
  contact.textContent = point.contact;

  const email = document.createElement("a");
  email.href = `mailto:${point.email}`;
  email.textContent = point.email;
  const source = document.createElement("a");
  source.href = point.source;
  source.textContent = "Sumber lokasi ↗";
  source.target = "_blank";
  source.rel = "noopener";
  source.setAttribute("aria-label", "Sumber lokasi (buka di tab baru)");
  content.append(name, area, contact, email, source);
  return content;
}

export default function CollectionMap() {
  const titleId = useId();
  const captionId = useId();
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapState, setMapState] = useState<MapState>("loading");

  useEffect(() => {
    const container = mapContainer.current;
    if (!container) return;

    let disposed = false;
    let map: LeafletMap | undefined;
    let resize: ResizeObserver | undefined;

    const visibility = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      visibility.disconnect();

      void import("leaflet").then((L) => {
        if (disposed) return;

        const leaflet = L.map(container, {
          scrollWheelZoom: false,
          dragging: !window.matchMedia("(pointer: coarse)").matches,
          zoomAnimation: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          maxZoom: 16,
        });
        map = leaflet;
        leaflet.attributionControl.setPrefix(false);
        const icon = L.divIcon({
          html: house,
          className: styles.pin,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -17],
        });

        const bounds = L.latLngBounds(collectionDirectory.map(({ coordinates }) => [...coordinates] as LatLngTuple));
        leaflet.fitBounds(bounds, { padding: [35, 35], maxZoom: 14, animate: false });
        for (const point of collectionDirectory) {
          const marker = L.marker([...point.coordinates], { icon, title: point.name, alt: point.name }).addTo(leaflet);
          const button = marker.getElement();
          button?.setAttribute("aria-label", point.name);
          button?.setAttribute("aria-expanded", "false");
          marker.bindPopup(() => popupContent(point), {
            className: styles.popup,
            maxWidth: 244,
            minWidth: 162,
            autoPanPadding: [16, 20],
          });
          marker.on("popupopen", () => {
            button?.setAttribute("aria-expanded", "true");
            marker.getPopup()?.getElement()?.querySelector(".leaflet-popup-close-button")?.setAttribute("aria-label", "Tutup info lokasi");
          });
          marker.on("popupclose", () => button?.setAttribute("aria-expanded", "false"));
          button?.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            event.stopPropagation();
            if (!event.repeat) {
              marker.togglePopup();
              if (marker.isPopupOpen()) marker.getPopup()?.getElement()?.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
            }
          });
          marker.getPopup()?.on("remove", () => {
            if (marker.getPopup()?.getElement()?.contains(document.activeElement)) button?.focus({ preventScroll: true });
          });
        }
        leaflet.zoomControl.getContainer()?.querySelector("a.leaflet-control-zoom-in")?.setAttribute("aria-label", "Perbesar peta");
        leaflet.zoomControl.getContainer()?.querySelector("a.leaflet-control-zoom-out")?.setAttribute("aria-label", "Perkecil peta");

        const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        });
        tiles.once("tileload", () => setMapState("ready"));
        tiles.on("tileerror", () => setMapState((state) => state === "ready" ? state : "unavailable"));
        tiles.addTo(leaflet);

        resize = new ResizeObserver(() => leaflet.invalidateSize({ pan: false }));
        resize.observe(container);
      }).catch(() => {
        if (!disposed) setMapState("unavailable");
      });
    }, { rootMargin: "200px" });

    visibility.observe(container);
    return () => {
      disposed = true;
      visibility.disconnect();
      resize?.disconnect();
      map?.remove();
    };
  }, []);

  return (
    <section className={styles.directory} aria-labelledby={titleId}>
      <h3 id={titleId}>Rujukan bank sampah</h3>
      <div className={styles.mapFrame}>
        <div
          ref={mapContainer}
          className={styles.map}
          role="region"
          aria-label="Peta bank sampah Jogja dan Sleman"
          aria-describedby={captionId}
        />
        {mapState === "unavailable" && (
          <p className={styles.mapNotice} role="status">Peta dasar belum termuat.</p>
        )}
      </div>
      <p id={captionId}>Pin menunjukkan area. Hubungi kelurahan untuk memastikan lokasi dan penerimaan kaca.</p>
    </section>
  );
}
