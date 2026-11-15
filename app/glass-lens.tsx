const displacement = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="128" viewBox="0 0 512 128">
  <defs>
    <linearGradient id="x">
      <stop offset="0" stop-color="#ff0000"/>
      <stop offset=".08" stop-color="#800000"/>
      <stop offset=".92" stop-color="#800000"/>
      <stop offset="1" stop-color="#000000"/>
    </linearGradient>
    <linearGradient id="y" x2="0" y2="1">
      <stop offset="0" stop-color="#00ff00"/>
      <stop offset=".22" stop-color="#008000"/>
      <stop offset=".78" stop-color="#008000"/>
      <stop offset="1" stop-color="#000000"/>
    </linearGradient>
  </defs>
  <rect width="512" height="128" fill="#000080"/>
  <rect width="512" height="128" fill="url(#x)" style="mix-blend-mode:screen"/>
  <rect width="512" height="128" fill="url(#y)" style="mix-blend-mode:screen"/>
</svg>`)} `;

export default function GlassLens() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: "fixed", pointerEvents: "none" }}
    >
      <defs>
        <filter
          id="revessel-liquid-lens"
          x="0"
          y="0"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={displacement.trim()}
            x="0"
            y="0"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            result="lens"
          />
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation="1.5"
            result="softened"
          />
          <feDisplacementMap
            in="softened"
            in2="lens"
            scale="18"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
