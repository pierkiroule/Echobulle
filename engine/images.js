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

  function draw(ctx, width, height, timestamp, pulse) {
    const img = currentImage(timestamp);
    if (!img) return;
    const elapsed = timestamp - lastSwitch;
    const fade = Math.min(1, elapsed / fadeTime);
    const alpha = 0.35 + 0.35 * fade + pulse * 0.15;
    ctx.save();
    ctx.globalAlpha = Math.min(0.9, alpha);
    const scale = 0.9 + Math.sin(timestamp * 0.0002 + pulse) * 0.06;
    const w = width * scale;
    const h = height * scale;
    const x = (width - w) / 2;
    const y = (height - h) / 2;
    ctx.translate(width / 2, height / 2);
    ctx.rotate(0.02 * Math.sin(timestamp * 0.0001));
    ctx.translate(-width / 2, -height / 2);
    ctx.drawImage(img, x, y, w, h);
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
