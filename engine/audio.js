import { BunnyEngine, AudioClip } from 'mediabunny';

const FALLBACK_GAIN = 0.25;

export function createAudioEngine(state) {
  const bunny = new BunnyEngine();
  const context = bunny.audioContext || new (window.AudioContext || window.webkitAudioContext)();
  const analyser = context.createAnalyser();
  analyser.fftSize = 1024;
  const energyBuffer = new Uint8Array(analyser.frequencyBinCount);
  const gain = context.createGain();
  gain.gain.value = FALLBACK_GAIN;
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1200;
  let media = null;
  let clip = null;
  let sourceNode = null;
  let lastEnergy = 0.4;

  gain.connect(filter);
  filter.connect(analyser);
  analyser.connect(context.destination);

  function connect(mediaEl) {
    if (sourceNode) {
      sourceNode.disconnect();
      sourceNode = null;
    }
    sourceNode = context.createMediaElementSource(mediaEl);
    sourceNode.connect(gain);
  }

  async function loadFile(file) {
    stop();
    clip = new AudioClip(file);
    const mediaElement = clip.mediaElement || new Audio();
    mediaElement.loop = true;
    mediaElement.crossOrigin = 'anonymous';
    mediaElement.preload = 'auto';
    mediaElement.volume = 0.65;
    media = mediaElement;
    connect(mediaElement);
    mediaElement.src = clip.src || URL.createObjectURL(file);
    await mediaElement.play().catch(() => {});
    state.nudgePulse(0.05);
  }

  function resume() {
    if (context.state === 'suspended') {
      context.resume();
    }
    if (media && media.paused) {
      media.play().catch(() => {});
    }
  }

  function pause() {
    if (media) media.pause();
    if (context.state === 'running' && context.suspend) {
      context.suspend().catch(() => {});
    }
  }

  function sampleEnergy() {
    if (!media) return lastEnergy;
    if (context.state !== 'running') return lastEnergy;
    analyser.getByteTimeDomainData(energyBuffer);
    let sum = 0;
    for (let i = 0; i < energyBuffer.length; i += 1) {
      const val = (energyBuffer[i] - 128) / 128;
      sum += val * val;
    }
    const rms = Math.sqrt(sum / energyBuffer.length);
    lastEnergy = Math.min(1, 0.15 + rms * 1.6);
    state.setEnergy(lastEnergy);
    return lastEnergy;
  }

  function applyPulse(pulse) {
    gain.gain.value = FALLBACK_GAIN + pulse * 0.25;
    filter.frequency.value = 400 + pulse * 1400;
  }

  function stop() {
    if (media) {
      media.pause();
      media.currentTime = 0;
    }
  }

  function reset() {
    stop();
    clip = null;
    media = null;
    lastEnergy = 0.4;
  }

  return {
    loadFile,
    resume,
    pause,
    sampleEnergy,
    applyPulse,
    stop,
    reset,
    get context() {
      return context;
    },
  };
}
