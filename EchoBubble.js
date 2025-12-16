import { createState } from './engine/state.js';
import { createAudioEngine } from './engine/audio.js';
import { createVideoEngine } from './engine/video.js';
import { createImagesEngine } from './engine/images.js';
import { createParticlesEngine } from './engine/particles.js';

const EXPOSURE_MODE = 'screen';
const EDITABLE_ITEMS = [
  { id: 'video', label: 'Vidéo' },
  { id: 'images', label: 'Image' },
  { id: 'tags', label: 'Tags' },
  { id: 'emoji', label: 'Emoji' },
  { id: 'texte', label: 'Texte' },
  { id: 'audio', label: 'Audio (symbolique)' },
];

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
    edit: document.getElementById('toggle-edit'),
  };
  const sourceList = document.getElementById('source-list');
  let animationId = null;
  let dragging = false;
  let dragId = null;
  let activeTouches = new Map();
  let pinchBase = null;

  const itemsForList = EDITABLE_ITEMS.map((item) => {
    const li = document.createElement('button');
    li.textContent = item.label;
    li.dataset.id = item.id;
    li.className = 'source-item';
    li.addEventListener('click', () => selectItem(item.id));
    return li;
  });

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
    const { editing, selected } = state.snapshot;
    if (editing && selected) {
      dragId = selected;
      dragging = true;
      updateTransformFromPointer(selected, x, y, rect);
    } else if (!editing) {
      particlesEngine.turbulence(x, y, state.snapshot.pulse);
      state.pushTurbulence((x - rect.width / 2) * 0.02, (y - rect.height / 2) * 0.02);
      state.nudgePulse(0.05);
      audioEngine.resume();
      videoEngine.resume();
    }
  }

  function selectItem(id) {
    state.setSelected(id);
    updateSourceList();
  }

  function updateSourceList() {
    if (!sourceList) return;
    const { editing, selected } = state.snapshot;
    sourceList.innerHTML = '';
    sourceList.style.display = editing ? 'flex' : 'none';
    if (!editing) return;
    itemsForList.forEach((item) => {
      if (item.dataset.id === selected) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
      sourceList.appendChild(item);
    });
  }

  function setEditingMode(on) {
    state.setEditing(on);
    if (on) {
      audioEngine.pause();
      videoEngine.pause();
      state.setSelected(state.snapshot.selected || 'video');
      buttons.edit.textContent = 'Reprendre le flux';
    } else {
      buttons.edit.textContent = 'Éditer le paysage';
      audioEngine.resume();
      videoEngine.resume();
      state.setSelected(null);
    }
    dragging = false;
    dragId = null;
    activeTouches.clear();
    pinchBase = null;
    updateSourceList();
  }

  function hitTest(x, y, width, height) {
    const order = ['images', 'video', 'particles'];
    for (const id of order) {
      const transform = state.getTransform(id);
      const cx = transform.x * width;
      const cy = transform.y * height;
      const w = width * transform.scale;
      const h = height * transform.scale;
      const rect = { x: cx - w / 2, y: cy - h / 2, w, h };
      if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
        if (id === 'particles') return 'tags';
        if (id === 'images') return 'images';
        return 'video';
      }
    }
    return null;
  }

  function updateTransformFromPointer(id, x, y, rect) {
    const normX = x / rect.width;
    const normY = y / rect.height;
    state.updateTransform(id, { x: normX, y: normY });
  }

  function handleWheel(event) {
    const { editing, selected } = state.snapshot;
    if (!editing || !selected) return;
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.04 : -0.04;
    const current = state.getTransform(selected);
    state.updateTransform(selected, { scale: current.scale + delta });
  }

  function handlePointerDown(event) {
    if (!state.snapshot.editing) return;
    const rect = viewport.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const target = hitTest(x, y, rect.width, rect.height) || state.snapshot.selected;
    if (target) {
      selectItem(target);
      dragging = true;
      dragId = target;
      updateTransformFromPointer(target, x, y, rect);
    }
    activeTouches.set(event.pointerId, { x, y });
    if (activeTouches.size === 2) {
      const points = Array.from(activeTouches.values());
      const [p1, p2] = points;
      pinchBase = {
        distance: Math.max(10, Math.hypot(p2.x - p1.x, p2.y - p1.y)),
        scale: state.getTransform(state.snapshot.selected || 'video').scale,
      };
    }
  }

  function handlePointerMove(event) {
    const { editing } = state.snapshot;
    if (!editing) {
      if (event.pressure > 0 || event.buttons > 0) {
        handlePointer(event);
      }
      return;
    }
    const rect = viewport.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    activeTouches.set(event.pointerId, { x, y });
    if (activeTouches.size === 2) {
      const points = Array.from(activeTouches.values());
      const [p1, p2] = points;
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const key = state.snapshot.selected || 'video';
      const base = pinchBase || { distance: dist, scale: state.getTransform(key).scale };
      const factor = dist / base.distance;
      state.updateTransform(key, { scale: base.scale * factor });
      return;
    }
    if (dragging && dragId) {
      updateTransformFromPointer(dragId, x, y, rect);
    }
  }

  function handlePointerUp(event) {
    activeTouches.delete(event.pointerId);
    pinchBase = null;
    dragging = false;
    dragId = null;
  }

  function handleDouble(event) {
    const { editing, selected } = state.snapshot;
    if (!editing || !selected) return;
    event.preventDefault();
    state.resetTransform(selected);
  }

  function drawSelectionHalo(width, height) {
    const { editing, selected } = state.snapshot;
    if (!editing || !selected) return;
    const transform = state.getTransform(selected);
    const cx = transform.x * width;
    const cy = transform.y * height;
    const w = width * transform.scale;
    const h = height * transform.scale;
    const rect = { x: cx - w / 2, y: cy - h / 2, w, h };
    ctx.save();
    ctx.strokeStyle = 'rgba(122, 210, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 10]);
    ctx.shadowColor = 'rgba(122, 210, 255, 0.25)';
    ctx.shadowBlur = 18;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(122, 210, 255, 0.06)';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }

  function draw(timestamp = 0) {
    const { width, height } = viewport.getBoundingClientRect();
    const { editing, exposureMode, turbulence } = state.snapshot;
    const videoTransform = state.getTransform('video');
    const imageTransform = state.getTransform('images');
    const particleTransform = state.getTransform('particles');
    const selected = state.snapshot.selected;
    const particleSelected = selected === 'tags' || selected === 'emoji' || selected === 'texte';

    if (!editing) {
      const energy = audioEngine.sampleEnergy();
      state.smoothPulse(energy, 0.06);
      state.smoothPulse(0.38, 0.005);
      const { pulse } = state.snapshot;
      audioEngine.applyPulse(pulse);
      ctx.fillStyle = 'rgba(3, 5, 12, 0.08)';
      ctx.fillRect(0, 0, width, height);
      videoEngine.draw(ctx, width, height, timestamp, videoTransform);
      ctx.save();
      ctx.globalCompositeOperation = exposureMode || EXPOSURE_MODE;
      imagesEngine.draw(ctx, width, height, timestamp, pulse, imageTransform);
      ctx.restore();
      particlesEngine.update(timestamp, pulse, turbulence);
      particlesEngine.draw(ctx, pulse, particleTransform, false);
    } else {
      ctx.fillStyle = 'rgba(4, 6, 12, 0.22)';
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = selected && selected !== 'video' ? 0.55 : 1;
      videoEngine.draw(ctx, width, height, timestamp, videoTransform);
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.globalCompositeOperation = exposureMode || EXPOSURE_MODE;
      ctx.globalAlpha = selected && selected !== 'images' ? 0.55 : 1;
      imagesEngine.draw(ctx, width, height, timestamp, state.snapshot.pulse, imageTransform);
      ctx.globalAlpha = 1;
      ctx.restore();
      ctx.globalAlpha = selected && !particleSelected ? 0.55 : 1;
      particlesEngine.draw(ctx, state.snapshot.pulse, particleTransform, true);
      ctx.globalAlpha = 1;
      drawSelectionHalo(width, height);
    }

    animationId = requestAnimationFrame(draw);
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
    setEditingMode(false);
  });
  buttons.capture.addEventListener('click', capturePNG);
  buttons.edit.addEventListener('click', () => {
    setEditingMode(!state.snapshot.editing);
  });

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

  viewport.addEventListener('click', (event) => {
    if (state.snapshot.editing) {
      const rect = viewport.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const target = hitTest(x, y, rect.width, rect.height);
      if (target) selectItem(target);
    } else {
      handlePointer(event);
    }
  });
  viewport.addEventListener('pointerdown', handlePointerDown);
  viewport.addEventListener('pointermove', handlePointerMove);
  viewport.addEventListener('pointerup', handlePointerUp);
  viewport.addEventListener('pointercancel', handlePointerUp);
  viewport.addEventListener('wheel', handleWheel, { passive: false });
  viewport.addEventListener('dblclick', handleDouble);

  const resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(viewport);
  resizeCanvas();
  updateSourceList();
  animationId = requestAnimationFrame(draw);

  return {
    state,
    audioEngine,
    videoEngine,
    imagesEngine,
    particlesEngine,
    capturePNG,
  };
}
