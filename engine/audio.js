let audioContext;

export function createAudioEngine(state) {
  let buffer = null;
  let source = null;
  let analyser = null;
  let gain = null;
  let filter = null;
  let energyBuffer = new Uint8Array(0);
  let lastEnergy = 0.4;

  async function ensureContext() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
  }

  function createNodes() {
    if (!audioContext) return;
    gain = audioContext.createGain();
    gain.gain.value = 0.3;

    filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1400;

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    energyBuffer = new Uint8Array(analyser.frequencyBinCount);
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
    if (!analyser) {
      createNodes();
    }
    const data = await file.arrayBuffer();
    buffer = await audioContext.decodeAudioData(data);
    stop();
    source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain);
    gain.connect(filter);
    filter.connect(analyser);
    analyser.connect(audioContext.destination);
    source.start();
    state.markAudioLoaded(file.name);
  }

  function sampleEnergy() {
    if (!analyser || audioContext?.state !== 'running') {
      return lastEnergy;
    }
    analyser.getByteTimeDomainData(energyBuffer);
    let sum = 0;
    for (let i = 0; i < energyBuffer.length; i += 1) {
      const v = (energyBuffer[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / energyBuffer.length);
    lastEnergy = Math.min(1, 0.15 + rms * 1.8);
    return lastEnergy;
  }

  function applyPulse(pulse) {
    if (!gain || !filter) return;
    gain.gain.value = 0.3 + pulse * 0.2;
    filter.frequency.value = 400 + pulse * 1200;
  }

  function reset() {
    stop();
    buffer = null;
    lastEnergy = 0.4;
    if (gain) {
      gain.disconnect();
      gain = null;
    }
    if (filter) {
      filter.disconnect();
      filter = null;
    }
    if (analyser) {
      analyser.disconnect();
      analyser = null;
    }
    energyBuffer = new Uint8Array(0);
  }

  return {
    loadFile,
    stop,
    reset,
    sampleEnergy,
    applyPulse,
    get context() {
      return audioContext;
    },
    get currentBuffer() {
      return buffer;
    },
  };
}
