const MAX_IMAGES = 12;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function createImagesEngine(state) {
  let images = [];
  let currentIndex = 0;
  let lastSwitch = 0;
  const holdTime = 4500;
  const fadeTime = 1200;

  async function loadFiles(fileList) {
    const files = Array.from(fileList).slice(0, MAX_IMAGES);
    const loaded = await Promise.all(files.map(loadImage));
    images = loaded;
    currentIndex = 0;
    lastSwitch = performance.now();
    state.markImages(images.length);
  }

  function currentImage(timestamp) {
    if (images.length === 0) return null;
    const elapsed = timestamp - lastSwitch;
    if (elapsed > holdTime + fadeTime) {
      currentIndex = (currentIndex + 1) % images.length;
      lastSwitch = timestamp;
    }
    return images[currentIndex] || null;
  }

  function frameRect(transform, width, height, scaleMul = 1) {
    const scale = (transform?.scale ?? 1) * scaleMul;
    const cx = (transform?.x ?? 0.5) * width;
    const cy = (transform?.y ?? 0.5) * height;
    const w = width * scale;
    const h = height * scale;
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  }

  function draw(ctx, width, height, timestamp, pulse, transform) {
    const img = currentImage(timestamp);
    if (!img) return;
    const elapsed = timestamp - lastSwitch;
    const fade = Math.min(1, elapsed / fadeTime);
    const alpha = 0.35 + 0.35 * fade + pulse * 0.15;
    ctx.save();
    ctx.globalAlpha = Math.min(0.9, alpha);
    const wobble = 0.9 + Math.sin(timestamp * 0.0002 + pulse) * 0.06;
    const rect = frameRect(transform, width, height, wobble);
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate(0.02 * Math.sin(timestamp * 0.0001));
    ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }

  function reset() {
    images = [];
    currentIndex = 0;
    lastSwitch = 0;
    state.markImages(0);
  }

  return { loadFiles, draw, reset };
}
