export function createVideoEngine(state) {
  const videoEl = document.createElement('video');
  videoEl.muted = true;
  videoEl.loop = true;
  videoEl.playsInline = true;
  videoEl.preload = 'auto';
  videoEl.crossOrigin = 'anonymous';
  videoEl.style.display = 'none';
  document.body.appendChild(videoEl);

  let currentUrl = null;
  let ready = false;

  function reset() {
    ready = false;
    videoEl.pause();
    videoEl.removeAttribute('src');
    videoEl.load();
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
      currentUrl = null;
    }
    state.markVideoStopped();
  }

  async function loadFile(file) {
    reset();
    currentUrl = URL.createObjectURL(file);
    videoEl.src = currentUrl;

    return new Promise((resolve, reject) => {
      const onLoaded = () => {
        ready = true;
        // Make the first frame available even if autoplay is blocked.
        videoEl.currentTime = 0;
        state.markVideoLoaded(file.name);
        cleanup();
        // Attempt playback but do not treat a blocked promise as fatal.
        videoEl.play().catch(() => {});
        resolve();
      };

      const onError = (error) => {
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        videoEl.removeEventListener('loadeddata', onLoaded);
        videoEl.removeEventListener('error', onError);
      };

      videoEl.addEventListener('loadeddata', onLoaded);
      videoEl.addEventListener('error', onError);
      videoEl.load();
    });
  }

  function isReady() {
    return ready && videoEl.videoWidth > 0 && videoEl.readyState >= 2;
  }

  function resume() {
    if (!isReady()) return;
    videoEl.play().catch(() => {});
  }

  function draw(ctx, width, height) {
    if (!isReady()) return;

    const vw = videoEl.videoWidth;
    const vh = videoEl.videoHeight;
    if (!vw || !vh) return;

    const videoRatio = vw / vh;
    const canvasRatio = width / height;

    let drawWidth = width;
    let drawHeight = height;
    let dx = 0;
    let dy = 0;

    if (videoRatio > canvasRatio) {
      drawHeight = height;
      drawWidth = height * videoRatio;
      dx = -(drawWidth - width) / 2;
    } else {
      drawWidth = width;
      drawHeight = width / videoRatio;
      dy = -(drawHeight - height) / 2;
    }

    ctx.drawImage(videoEl, dx, dy, drawWidth, drawHeight);
  }

  return {
    loadFile,
    reset,
    isReady,
    draw,
    resume,
    get element() {
      return videoEl;
    },
    get currentUrl() {
      return currentUrl;
    },
  };
}
