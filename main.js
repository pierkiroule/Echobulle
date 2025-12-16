import { createAudioEngine } from './engine/audio.js';
import { createVideoEngine } from './engine/video.js';
import { createParticlesEngine } from './engine/particles.js';
import { createImagesEngine } from './engine/images.js';
import { createState } from './engine/state.js';

const state = createState();
const viewport = document.getElementById('viewport');
const videoEl = document.getElementById('echo-video');
const particlesCanvas = document.getElementById('particle-layer');
const overlayImagesContainer = document.getElementById('overlay-images');

const audioInput = document.getElementById('file-audio');
const videoInput = document.getElementById('file-video');
const imagesInput = document.getElementById('file-images');

const audioEngine = createAudioEngine(state);
const videoEngine = createVideoEngine(state, videoEl);
const particlesEngine = createParticlesEngine(particlesCanvas, state);
const imagesEngine = createImagesEngine(overlayImagesContainer, state);

const buttons = {
  audio: document.getElementById('import-audio'),
  video: document.getElementById('import-video'),
  images: document.getElementById('import-images'),
  reset: document.getElementById('reset-all'),
};

buttons.audio.addEventListener('click', () => {
  audioInput.click();
});

buttons.video.addEventListener('click', () => {
  videoInput.click();
});

buttons.images.addEventListener('click', () => {
  imagesInput.click();
});

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

imagesInput.addEventListener('change', async (event) => {
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
  particlesEngine.turbulence(x, y);
});

// Préparation pour un futur export : les moteurs exposent un accès simple
// au flux audio/vidéo actuel. L'implémentation concrète sera ajoutée plus tard.
window.echoBulle = {
  state,
  audioEngine,
  videoEngine,
  particlesEngine,
  imagesEngine,
};
