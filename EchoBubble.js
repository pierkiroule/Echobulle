import { createState } from './engine/state.js';
import { createAudioEngine } from './engine/audio.js';
import { createVideoEngine } from './engine/video.js';
import { createImagesEngine } from './engine/images.js';
import { createParticlesEngine } from './engine/particles.js';

const EXPOSURE_MODE = 'screen';

export function createEchoBubble(root) {
  const state = createState();
  const canvas = root.querySelector('#echo-canvas');
  const viewport = root.querySelector('.viewport');
  const ctx = canvas.getContext('2d');
  const audioEngine = createAudioEngine(state);
  const videoEngine = createVideoEngine(state);
  const imagesEngine = createImagesEngine(state);
  const particlesEngine = createParticlesEngine(state);
  const audioInput = document.getElementById('file-audio');
  const videoInput = document.getElementById('file-video');
  const imagesInput = document.getElementById('file-images');
  const buttons = {
    audio: document.getElementById('import-audio'),
    video: document.getElementById('import-video'),
    images: document.getElementById('import-images'),
    reset: document.getElementById('reset-all'),
    capture: document.getElementById('capture'),
  };

  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const rect = viewport.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    particlesEngine.setBounds(rect.width, rect.height);
  }

  function capturePNG() {
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'echobulle.png';
    a.click();
  }

  function handlePointer(event) {
    const rect = viewport.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    particlesEngine.turbulence(x, y, state.snapshot.pulse);
    state.pushTurbulence((x - rect.width / 2) * 0.02, (y - rect.height / 2) * 0.02);
    state.nudgePulse(0.05);
    audioEngine.resume();
    videoEngine.resume();
  }

  function draw(timestamp = 0) {
    const { width, height } = viewport.getBoundingClientRect();
    const energy = audioEngine.sampleEnergy();
    state.smoothPulse(energy, 0.06);
    state.smoothPulse(0.38, 0.005);
    const { pulse, exposureMode, turbulence } = state.snapshot;
    audioEngine.applyPulse(pulse);

    ctx.fillStyle = 'rgba(3, 5, 12, 0.08)';
    ctx.fillRect(0, 0, width, height);

    videoEngine.draw(ctx, width, height, timestamp);

    ctx.save();
    ctx.globalCompositeOperation = exposureMode || EXPOSURE_MODE;
    imagesEngine.draw(ctx, width, height, timestamp, pulse);
    ctx.restore();

    particlesEngine.update(timestamp, pulse, turbulence);
    particlesEngine.draw(ctx, pulse);

    requestAnimationFrame(draw);
  }

  buttons.audio.addEventListener('click', () => audioInput.click());
  buttons.video.addEventListener('click', () => videoInput.click());
  buttons.images.addEventListener('click', () => imagesInput.click());
  buttons.reset.addEventListener('click', () => {
    audioEngine.reset();
    videoEngine.reset();
    imagesEngine.reset();
    particlesEngine.reset();
    state.reset();
  });
  buttons.capture.addEventListener('click', capturePNG);

  audioInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await audioEngine.loadFile(file);
    audioInput.value = '';
  });

  videoInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await videoEngine.loadFile(file);
    videoInput.value = '';
  });

  imagesInput.addEventListener('change', async (event) => {
    const { files } = event.target;
    if (!files || files.length === 0) return;
    await imagesEngine.loadFiles(files);
    imagesInput.value = '';
  });

  viewport.addEventListener('click', handlePointer);
  viewport.addEventListener('pointermove', (event) => {
    if (event.pressure > 0 || event.buttons > 0) {
      handlePointer(event);
    }
  });

  const resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(viewport);
  resizeCanvas();
  requestAnimationFrame(draw);

  return {
    state,
    audioEngine,
    videoEngine,
    imagesEngine,
    particlesEngine,
    capturePNG,
  };
}
