export function createVideoEngine(state, videoEl) {
  let currentUrl = null;

  function reset() {
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
    videoEl.loop = true;
    videoEl.playsInline = true;
    videoEl.muted = true;

    return new Promise((resolve, reject) => {
      const onLoaded = () => {
        videoEl.play().catch(reject);
        state.markVideoLoaded(file.name);
        cleanup();
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
    });
  }

  return {
    loadFile,
    reset,
    get element() {
      return videoEl;
    },
    get currentUrl() {
      return currentUrl;
    },
  };
}
