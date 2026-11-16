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

function paintCopy(context, element, bounds, alpha, isControl) {
  const style = getComputedStyle(element);
  if (style.visibility !== "visible" || alpha === 0) return;

  const range = document.createRange();
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const lines = new Map();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    for (const word of node.textContent.matchAll(/\S+/g)) {
      range.setStart(node, word.index);
      range.setEnd(node, word.index + word[0].length);
      const rect = range.getBoundingClientRect();
      const line = lines.get(rect.top);
      if (line) line.text += " " + word[0];
      else lines.set(rect.top, { rect, text: word[0] });
    }
  }

  context.save();
  context.globalAlpha = alpha;
  if (isControl) {
    context.beginPath();
    context.roundRect(bounds.left, bounds.top, bounds.width, bounds.height, parseFloat(style.borderRadius));
    context.fillStyle = style.backgroundColor;
    context.fill();
    context.strokeStyle = style.borderTopColor;
    context.lineWidth = 1;
    context.stroke();
  }
  context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  context.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
  context.fillStyle = style.color;
  const metrics = context.measureText("Hg");
  for (const { rect, text } of lines.values()) {
    const baseline = rect.top + (rect.height + metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) / 2;
    context.fillText(text, rect.left, baseline);
  }
  if (isControl) {
    const icon = element.querySelector("svg");
    if (icon?.viewBox.baseVal.width) {
      const box = icon.getBoundingClientRect();
      const viewBox = icon.viewBox.baseVal;
      context.translate(box.left, box.top);
      context.scale(box.width / viewBox.width, box.height / viewBox.height);
      context.strokeStyle = style.color;
      context.lineWidth = Number(icon.getAttribute("stroke-width")) || 1.5;
      context.lineCap = "round";
      context.lineJoin = "round";
      for (const path of icon.querySelectorAll("path[d]")) {
        context.stroke(new Path2D(path.getAttribute("d")));
      }
    }
  }
  context.restore();
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

export function paintFluidScene(context, viewport, zone) {
  const bounds = zone.getBoundingClientRect();
  const backdrop = zone.dataset.fluidZone === "story" ? zone.parentElement : zone;
  context.save();
  context.translate(-viewport.left, -viewport.top);
  context.beginPath();
  context.rect(bounds.left, bounds.top, bounds.width, bounds.height);
  context.clip();
  context.fillStyle = getComputedStyle(backdrop).backgroundColor;
  context.fillRect(viewport.left, viewport.top, viewport.width, viewport.height);

  const layers = [...zone.querySelectorAll("[data-fluid-layer]")];
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
  for (const element of layers) {
    const type = element.dataset.fluidLayer;
    if (type !== "text" && type !== "control") continue;
    const rect = element.getBoundingClientRect();
    if (rect.right < viewport.left || rect.left > viewport.right ||
        rect.bottom < viewport.top || rect.top > viewport.bottom) continue;
    paintCopy(context, element, rect, Number(getComputedStyle(element.parentElement).opacity), type === "control");
  }
  context.restore();
}
