export default function Icon({
  kind,
  className = "",
}: {
  kind:
    | "down"
    | "close"
    | "plus"
    | "minus"
    | "external"
    | "bottle"
    | "route"
    | "home"
    | "about"
    | "gallery"
    | "article"
    | "contact";
  className?: string;
}) {
  const paths = {
    down: "M12 4v16M6 14l6 6 6-6",
    close: "m6 6 12 12M6 18 18 6",
    plus: "M12 5v14M5 12h14",
    minus: "M5 12h14",
    external: "M6 18 18 6M9 6h9v9",
    bottle:
      "M9 3h6M10 3v5l-3 4v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-8l-3-4V3M7 14h10",
    route:
      "M6 5a2 2 0 1 0 0 .01M18 19a2 2 0 1 0 0 .01M8 5h7a4 4 0 0 1 0 8H9a3 3 0 0 0 0 6h7",
    home: "m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8",
    about: "M12 11v6M12 7h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
    gallery: "M3 3h18v18H3zM3 16l6-6 5 5 3-3 4 4M16 7h.01",
    article: "M5 3h14v18H5zM8 7h8M8 11h8M8 15h5",
    contact: "M3 5h18v14H3zM3 5l9 8 9-8",
  };
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[kind]} />
    </svg>
  );
}
