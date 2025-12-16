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
  const visualInput = document.getElementById('file-visual');
  const thoughtInput = document.getElementById('thought-input');
  const tagPulseButton = document.getElementById('tag-pulse');
  const hashtagLine = document.getElementById('hashtags-line');
  const buttons = {
    audio: document.getElementById('import-audio'),
    visual: document.getElementById('import-visual'),
    reset: document.getElementById('reset-all'),
    capture: document.getElementById('capture'),
  };
  let animationId = null;

  function renderHashtagsLine() {
    const tags = state.snapshot.tags;
    hashtagLine.textContent = tags.join('   ');
  }

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

  function pulverizeText() {
    const raw = (thoughtInput.value || '').trim();
    if (!raw) return;
    const words = raw
      .replace(/[\n\r]+/g, ' ')
      .split(/\s+/)
      .filter((w) => w.trim().length > 0)
      .map((w) => `#${w.replace(/[^\p{L}\p{N}_-]+/gu, '')}`)
      .filter((w) => w.length > 1);
    if (words.length === 0) return;
    state.setHashtags(words);
    bubblesEngine.reset();
    hashtagLine.textContent = words.join('   ');
    state.nudgePulse(0.03);
    renderHashtagsLine();
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
  buttons.visual.addEventListener('click', () => visualInput.click());
  buttons.reset.addEventListener('click', () => {
    audioEngine.reset();
    bubblesEngine.reset();
    state.reset();
    renderHashtagsLine();
  });
  buttons.capture.addEventListener('click', capturePNG);

  audioInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await audioEngine.loadFile(file);
    audioInput.value = '';
  });

  visualInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('video/')) {
      await bubblesEngine.ingestVideo(file);
    } else {
      await bubblesEngine.ingestImage(file);
    }
    visualInput.value = '';
  });

  tagPulseButton.addEventListener('click', pulverizeText);

  renderHashtagsLine();

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
