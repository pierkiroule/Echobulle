import { createAudioEngine } from './engine/audio.js';
import { createVideoEngine } from './engine/video.js';
import { createState } from './engine/state.js';

const state = createState();
const videoEl = document.getElementById('echo-video');
const audioInput = document.getElementById('file-audio');
const videoInput = document.getElementById('file-video');

const audioEngine = createAudioEngine(state);
const videoEngine = createVideoEngine(state, videoEl);

const buttons = {
  audio: document.getElementById('import-audio'),
  video: document.getElementById('import-video'),
  reset: document.getElementById('reset-all'),
};

buttons.audio.addEventListener('click', () => {
  audioInput.click();
});

buttons.video.addEventListener('click', () => {
  videoInput.click();
});

buttons.reset.addEventListener('click', () => {
  audioEngine.reset();
  videoEngine.reset();
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

// Préparation pour un futur export : les deux moteurs exposent un accès simple
// au flux audio/vidéo actuel. L'implémentation concrète sera ajoutée plus tard.
window.echoBulle = {
  state,
  audioEngine,
  videoEngine,
};
