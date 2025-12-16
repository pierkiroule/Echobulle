import { createState } from './engine/state.js';
import { createAudioEngine } from './engine/audio.js';
import { createBubblesEngine } from './engine/bubbles.js';

export function createEchoBubble(root) {
  const state = createState();
  const canvas = root.querySelector('#echo-canvas');
  const viewport = root.querySelector('.viewport');
  const ctx = canvas.getContext('2d');
  const audioEngine = createAudioEngine(state);
  const bubblesEngine = createBubblesEngine(state);
  const audioInput = document.getElementById('file-audio');
  const videoInput = document.getElementById('file-video');
  const imageInput = document.getElementById('file-image');
  const buttons = {
    audio: document.getElementById('import-audio'),
    video: document.getElementById('import-video'),
    image: document.getElementById('import-image'),
    reset: document.getElementById('reset-all'),
    capture: document.getElementById('capture'),
  };
  let animationId = null;

  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const rect = viewport.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    bubblesEngine.setBounds(rect.width, rect.height);
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
    bubblesEngine.impulse(x, y);
    state.nudgePulse(0.04);
    audioEngine.resume();
  }

  function draw(timestamp = 0) {
    const { width, height } = viewport.getBoundingClientRect();
    const energy = audioEngine.sampleEnergy();
    state.smoothPulse(energy, 0.04);
    state.smoothPulse(0.32, 0.01);
    const { pulse } = state.snapshot;
    audioEngine.applyPulse(pulse);

    ctx.fillStyle = 'rgba(5, 7, 12, 0.12)';
    ctx.fillRect(0, 0, width, height);

    bubblesEngine.update(timestamp, pulse);
    bubblesEngine.draw(ctx, timestamp, pulse);

    animationId = requestAnimationFrame(draw);
  }

  buttons.audio.addEventListener('click', () => audioInput.click());
  buttons.video.addEventListener('click', () => videoInput.click());
  buttons.image.addEventListener('click', () => imageInput.click());
  buttons.reset.addEventListener('click', () => {
    audioEngine.reset();
    bubblesEngine.reset();
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
    await bubblesEngine.ingestVideo(file);
    videoInput.value = '';
  });

  imageInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await bubblesEngine.ingestImage(file);
    imageInput.value = '';
  });

  viewport.addEventListener('click', handlePointer);
  viewport.addEventListener('pointerdown', (event) => {
    if (event.pressure > 0 || event.buttons > 0) handlePointer(event);
  });

  const resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(viewport);
  resizeCanvas();
  bubblesEngine.reset();
  animationId = requestAnimationFrame(draw);

  return {
    state,
    audioEngine,
    bubblesEngine,
    capturePNG,
    destroy() {
      if (animationId) cancelAnimationFrame(animationId);
    },
  };
}
