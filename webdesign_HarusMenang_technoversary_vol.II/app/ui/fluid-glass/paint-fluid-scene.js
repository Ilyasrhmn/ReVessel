function fillGradient(context, bounds, axis, stops) {
  const { left, top, right, bottom, width, height } = bounds;
  const edges = {
    right: [left, top, right, top],
    down: [left, top, left, bottom],
    up: [left, bottom, left, top],
  };
  const gradient = context.createLinearGradient(...edges[axis]);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  context.fillStyle = gradient;
  context.fillRect(left, top, width, height);
}

function paintImage(context, element) {
  const image = element.querySelector("img");
  if (!image?.naturalWidth) return;
  const bounds = image.getBoundingClientRect();
  const [x, y] = getComputedStyle(image).objectPosition.split(" ").map(value => parseFloat(value) / 100);
  const scale = Math.max(bounds.width / image.naturalWidth, bounds.height / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;

  context.save();
  context.beginPath();
  context.rect(bounds.left, bounds.top, bounds.width, bounds.height);
  context.clip();
  context.filter = getComputedStyle(image.parentElement).filter;
  context.drawImage(image, bounds.left + (bounds.width - width) * x, bounds.top + (bounds.height - height) * y, width, height);
  context.restore();
}


function intersects(rect, viewport) {
  return rect.width && rect.height && rect.right > viewport.left && rect.left < viewport.right &&
    rect.bottom > viewport.top && rect.top < viewport.bottom;
}

function paintText(context, node, style, viewport) {
  const range = document.createRange();
  range.selectNodeContents(node);
  if (!intersects(range.getBoundingClientRect(), viewport) || !node.textContent.trim()) return;

  const lines = new Map();
  for (const word of node.textContent.matchAll(/\S+/g)) {
    range.setStart(node, word.index);
    range.setEnd(node, word.index + word[0].length);
    const rect = range.getBoundingClientRect();
    if (!rect.width) continue;
    const line = lines.get(rect.top);
    if (line) line.text += " " + word[0];
    else lines.set(rect.top, { rect, text: word[0] });
  }

  context.font = [style.fontStyle, style.fontWeight, style.fontSize, style.fontFamily].join(" ");
  context.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
  context.fillStyle = style.color;
  const metrics = context.measureText("Hg");
  for (const { rect, text } of lines.values()) {
    const baseline = rect.top + (rect.height + metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) / 2;
    context.fillText(text, rect.left, baseline);
  }
}

const symbolPaths = new Map();

function referencedPath(use, repaint) {
  const href = use.getAttribute("href");
  if (!href?.startsWith("/brand/")) return null;
  if (!symbolPaths.has(href)) {
    const [url, id] = href.split("#");
    symbolPaths.set(href, null);
    fetch(url).then(response => response.ok ? response.text() : "").then(source => {
      const document = new DOMParser().parseFromString(source, "image/svg+xml");
      const data = document.getElementById(id)?.getAttribute("d");
      if (data) {
        symbolPaths.set(href, new Path2D(data));
        repaint();
      }
    }).catch(() => {});
  }
  return symbolPaths.get(href);
}

function paintSvg(context, svg, bounds, repaint) {
  const viewBox = svg.viewBox.baseVal;
  if (!viewBox.width || !viewBox.height) return;
  const scale = Math.min(bounds.width / viewBox.width, bounds.height / viewBox.height);
  context.translate(bounds.left + (bounds.width - viewBox.width * scale) / 2, bounds.top + (bounds.height - viewBox.height * scale) / 2);
  context.scale(scale, scale);
  context.translate(-viewBox.x, -viewBox.y);
  for (const node of svg.querySelectorAll("path[d], use")) {
    const isUse = node.localName === "use";
    const path = isUse ? referencedPath(node, repaint) : new Path2D(node.getAttribute("d"));
    if (!path) continue;
    const style = getComputedStyle(node);
    const fill = isUse ? style.color : style.fill;
    if (fill !== "none") {
      context.fillStyle = fill;
      context.fill(path, style.fillRule);
    }
    if (style.stroke !== "none") {
      context.strokeStyle = style.stroke;
      context.lineWidth = parseFloat(style.strokeWidth) || 1;
      context.lineCap = style.strokeLinecap;
      context.lineJoin = style.strokeLinejoin;
      context.stroke(path);
    }
  }
}

function paintContent(context, root, viewport, repaint) {
  function visit(element, parentOpacity) {
    const layer = element.dataset?.fluidLayer;
    if (["image", "story", "shade"].includes(layer)) return;

    const bounds = element.getBoundingClientRect();
    if (!intersects(bounds, viewport)) return;
    const style = getComputedStyle(element);
    const opacity = parentOpacity * Number(style.opacity);
    if (style.visibility !== "visible" || opacity === 0) return;

    context.save();
    context.globalAlpha = opacity;
    if (element instanceof SVGSVGElement) {
      paintSvg(context, element, bounds, repaint);
    } else {
      if (layer === "control" || layer === "surface") {
        context.beginPath();
        context.roundRect(bounds.left, bounds.top, bounds.width, bounds.height, parseFloat(style.borderRadius) || 0);
        context.fillStyle = style.backgroundColor;
        context.fill();
        if (layer === "control") {
          context.strokeStyle = style.borderTopColor;
          context.lineWidth = 1;
          context.stroke();
        }
      }
      for (const node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) paintText(context, node, style, viewport);
        if (node instanceof Element) visit(node, opacity);
      }
    }
    context.restore();
  }

  visit(root, 1);
}

function paintStory(context, element) {
  const bounds = element.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  context.save();
  context.beginPath();
  context.rect(bounds.left, bounds.top, bounds.width, bounds.height);
  context.clip();
  for (const scene of element.children) {
    const style = getComputedStyle(scene);
    if (Number(style.opacity) === 0) continue;
    const inset = style.clipPath.match(/inset\(0(?:px|%) 0(?:px|%) 0(?:px|%) ([\d.]+)%\)/);
    const crop = inset ? bounds.width * Number(inset[1]) / 100 : 0;
    context.save();
    context.globalAlpha = Number(style.opacity);
    context.beginPath();
    context.rect(bounds.left + crop, bounds.top, bounds.width - crop, bounds.height);
    context.clip();
    paintImage(context, scene);
    context.restore();
  }
  const narrow = window.innerWidth <= 760;
  fillGradient(context, bounds, "up", [[0, "#191b1e"], [narrow ? 0.5 : 0.27, "#191b1e00"]]);
  fillGradient(context, bounds, "down", [[0, "#191b1e99"], [narrow ? 0.65 : 0.24, "#191b1e00"]]);
  fillGradient(context, bounds, "right", [[0, narrow ? "#191b1ea6" : "#191b1e"], [narrow ? 0.9 : 0.68, "#191b1e00"]]);
  context.restore();
}

export function paintFluidScene(context, viewport, zone, repaint) {
  const bounds = zone.getBoundingClientRect();
  const backdrop = zone.dataset.fluidZone === "story" ? zone.parentElement : zone;
  context.save();
  context.translate(-viewport.left, -viewport.top);
  context.beginPath();
  context.rect(bounds.left, bounds.top, bounds.width, bounds.height);
  context.clip();
  context.fillStyle = getComputedStyle(backdrop).backgroundColor;
  context.fillRect(viewport.left, viewport.top, viewport.width, viewport.height);

  const layers = [...zone.querySelectorAll('[data-fluid-layer="image"], [data-fluid-layer="story"], [data-fluid-layer="shade"]')];
  for (const element of layers) {
    const type = element.dataset.fluidLayer;
    if (type === "image") paintImage(context, element);
    if (type === "story") paintStory(context, element);
    if (type === "shade") {
      if (window.innerWidth <= 760) {
        fillGradient(context, bounds, "down", [[0, "#d9dcdf"], [0.55, "#d9dcdf30"], [1, "#e3e5e7b0"]]);
      } else {
        fillGradient(context, bounds, "up", [[0, "#edeef2b3"], [0.34, "#edeef200"]]);
        fillGradient(context, bounds, "right", [[0, "#e4e5e780"], [0.65, "#e4e5e700"]]);
      }
    }
  }
  paintContent(context, zone, viewport, repaint);
  const brand = zone.id === "beranda" ? document.querySelector("[data-fluid-hero-brand]") : null;
  if (brand) paintContent(context, brand, viewport, repaint);
  context.restore();
}
