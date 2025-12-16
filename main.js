import { createAudioEngine } from './engine/audio.js';
import { createVideoEngine } from './engine/video.js';
import { createParticlesEngine } from './engine/particles.js';
import { createImagesEngine } from './engine/images.js';
import { createState } from './engine/state.js';
import { createAttractors } from './engine/attractors.js';

const state = createState();
const viewport = document.getElementById('viewport');
const canvas = document.getElementById('echo-canvas');
const ctx = canvas.getContext('2d');

// Simple switch for the composite blend mode used when merging images with the video.
const EXPOSURE_MODE = 'screen';

const audioInput = document.getElementById('file-audio');
const videoInput = document.getElementById('file-video');
const imagesInput = document.getElementById('file-images');

const audioEngine = createAudioEngine(state);
const videoEngine = createVideoEngine(state);
const particlesEngine = createParticlesEngine(state);
const imagesEngine = createImagesEngine(state);
const attractors = createAttractors();

const buttons = {
  audio: document.getElementById('import-audio'),
  video: document.getElementById('import-video'),
  images: document.getElementById('import-images'),
  reset: document.getElementById('reset-all'),
};

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const { width, height } = viewport.getBoundingClientRect();
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(ratio, ratio);
  particlesEngine.setBounds(width, height);
}

function draw(timestamp = 0) {
  const { width, height } = viewport.getBoundingClientRect();
  const energy = audioEngine.sampleEnergy();
  state.smoothPulse(energy, 0.03);
  // Gentle relaxation to keep the pulse in a calm band over time.
  state.smoothPulse(0.4, 0.002);
  const { pulse } = state.snapshot;
  audioEngine.applyPulse(pulse);

  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(3, 5, 10, 0.08)';
  ctx.fillRect(0, 0, width, height);

  attractors.update(pulse, timestamp);
  // 1) Video drawn into the canvas.
  videoEngine.draw(ctx, width, height);

  // 2) Double exposure: blend imported images over the video using a selectable mode.
  imagesEngine.update(timestamp, pulse);
  ctx.save();
  ctx.globalCompositeOperation = EXPOSURE_MODE;
  imagesEngine.draw(ctx, width, height, timestamp, pulse);
  ctx.restore();

  // 3) Emoji attractors softly orbiting.
  attractors.draw(ctx, width, height, pulse);

  // 4) Particles rendered above using their own blend mode and influenced by attractors.
  const attractorPositions = attractors.positions(width, height, pulse);
  particlesEngine.update(timestamp, pulse, attractorPositions);
  particlesEngine.draw(ctx, pulse);

  requestAnimationFrame(draw);
}

buttons.audio.addEventListener('click', () => audioInput.click());
buttons.video.addEventListener('click', () => videoInput.click());
buttons.images.addEventListener('click', () => imagesInput.click());

buttons.reset.addEventListener('click', () => {
  audioEngine.reset();
  videoEngine.reset();
  particlesEngine.reset();
  imagesEngine.reset();
  state.reset();
});

audioInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    await audioEngine.loadFile(file);
  } catch (error) {
    console.error('Erreur lors du chargement audio', error);
  } finally {
    audioInput.value = '';
  }
});

videoInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    await videoEngine.loadFile(file);
  } catch (error) {
    console.error('Erreur lors du chargement vidéo', error);
  } finally {
    videoInput.value = '';
  }
});

imagesInput.addEventListener('change', (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  try {
    imagesEngine.loadFiles(files);
  } catch (error) {
    console.error('Erreur lors du chargement des images', error);
  } finally {
    imagesInput.value = '';
  }
});

viewport.addEventListener('click', (event) => {
  const rect = viewport.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const { pulse } = state.snapshot;
  particlesEngine.turbulence(x, y, pulse);
  state.nudgePulse(0.06);
  if (audioEngine.context && audioEngine.context.state === 'suspended') {
    audioEngine.context.resume();
  }
  videoEngine.resume();
});

const resizeObserver = new ResizeObserver(resizeCanvas);
resizeObserver.observe(viewport);
resizeCanvas();
requestAnimationFrame(draw);

// Préparation pour un futur export : les moteurs exposent un accès simple
// au flux audio/vidéo actuel. L'implémentation concrète sera ajoutée plus tard.
window.echoBulle = {
  state,
  audioEngine,
  videoEngine,
  particlesEngine,
  imagesEngine,
};
