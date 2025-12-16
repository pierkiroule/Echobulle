export function createImagesEngine(container, state) {
  const img = document.createElement('img');
  img.alt = '';
  img.className = 'overlay-image';
  container.appendChild(img);

  let timer = null;
  let items = [];
  let index = 0;
  const intervalMs = 8000;

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function revokeAll() {
    items.forEach((item) => URL.revokeObjectURL(item.url));
  }

  function scheduleNext() {
    clearTimer();
    if (items.length <= 1) return;
    timer = setTimeout(() => {
      fadeTo((index + 1) % items.length);
    }, intervalMs);
  }

  function fadeTo(nextIndex) {
    img.style.opacity = '0';
    setTimeout(() => {
      index = nextIndex;
      const next = items[index];
      img.style.transform = `translateZ(0) scale(${next.scale}) rotate(${next.rotation}deg)`;
      img.src = next.url;
      img.onload = () => {
        img.style.opacity = '0.7';
      };
      scheduleNext();
    }, 350);
  }

  function loadFiles(fileList) {
    revokeAll();
    clearTimer();
    items = Array.from(fileList || [])
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
        scale: 0.6 + Math.random() * 0.5,
        rotation: (Math.random() - 0.5) * 10,
      }));

    if (items.length === 0) {
      img.style.opacity = '0';
      return;
    }

    index = 0;
    state.markImagesLoaded(items.length);
    img.style.opacity = '0';
    fadeTo(0);
  }

  function reset() {
    revokeAll();
    clearTimer();
    items = [];
    index = 0;
    img.style.opacity = '0';
    img.removeAttribute('src');
  }

  return {
    loadFiles,
    reset,
  };
}
