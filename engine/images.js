export function createImagesEngine(state) {
  let items = [];
  let index = 0;
  let transitionStart = 0;
  let showing = false;
  let switching = false;
  let switchDelay = 8000;
  let fadeDuration = 800;
  let lastSwitch = 0;

  function revokeAll() {
    items.forEach((item) => URL.revokeObjectURL(item.url));
  }

  function loadFiles(fileList) {
    revokeAll();
    const files = Array.from(fileList || []).filter((file) => file.type.startsWith('image/'));
    items = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      img: null,
      ready: false,
      scale: 0.6 + Math.random() * 0.5,
      rotation: (Math.random() - 0.5) * 12,
    }));
    index = 0;
    showing = false;
    switching = false;
    transitionStart = 0;
    lastSwitch = 0;

    if (items.length === 0) return;

    items.forEach((item) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        item.img = image;
        item.ready = true;
      };
      image.src = item.url;
    });

    state.markImagesLoaded(items.length);
  }

  function update(timestamp, pulse) {
    if (items.length === 0) return;

    if (!showing) {
      showing = true;
      transitionStart = timestamp;
      lastSwitch = timestamp;
      return;
    }

    const elapsed = timestamp - lastSwitch;
    if (elapsed > switchDelay && items.length > 1) {
      index = (index + 1) % items.length;
      transitionStart = timestamp;
      lastSwitch = timestamp;
      switching = true;
    }

    if (switching && timestamp - transitionStart > fadeDuration) {
      switching = false;
    }
  }

  function draw(ctx, width, height, timestamp, pulse) {
    if (items.length === 0) return;
    const current = items[index];
    if (!current.img || !current.ready || !current.img.complete) return;

    const fadeProgress = Math.min(1, (timestamp - transitionStart) / fadeDuration);
    const alphaBase = switching ? 1 - fadeProgress * 0.3 : Math.min(0.75, 0.3 + fadeProgress);
    const alpha = alphaBase * (0.7 + pulse * 0.4);

    const iw = current.img.width;
    const ih = current.img.height;
    if (!iw || !ih) return;

    const baseScale = Math.min(width / iw, height / ih) * current.scale;
    const drawW = iw * baseScale;
    const drawH = ih * baseScale;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    const rotationPulse = current.rotation + Math.sin(timestamp * 0.00015) * 6 * pulse;
    ctx.rotate((rotationPulse * Math.PI) / 180);
    ctx.globalAlpha = alpha;
    ctx.drawImage(current.img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function reset() {
    revokeAll();
    items = [];
    index = 0;
    showing = false;
    switching = false;
    transitionStart = 0;
    lastSwitch = 0;
  }

  return {
    loadFiles,
    update,
    draw,
    reset,
  };
}
