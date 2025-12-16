let audioContext;

export function createAudioEngine(state) {
  let buffer = null;
  let source = null;

  async function ensureContext() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
  }

  function stop() {
    if (source) {
      source.stop(0);
      source.disconnect();
      source = null;
    }
    state.markAudioStopped();
  }

  async function loadFile(file) {
    await ensureContext();
    const data = await file.arrayBuffer();
    buffer = await audioContext.decodeAudioData(data);
    stop();
    source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(audioContext.destination);
    source.start();
    state.markAudioLoaded(file.name);
  }

  function reset() {
    stop();
    buffer = null;
  }

  return {
    loadFile,
    stop,
    reset,
    get context() {
      return audioContext;
    },
    get currentBuffer() {
      return buffer;
    },
  };
}
