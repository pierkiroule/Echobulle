const DEFAULT_TAGS = ['bulle', 'souffle', 'lenteur', 'halo', 'onde', 'flux'];
const DEFAULT_EMOJIS = ['●', '○', '◐', '◑', '◒', '◓'];
const STORAGE_KEY = 'echobulle-layout-v2';

const BASE_TRANSFORMS = {
  bubbles: { x: 0.5, y: 0.5, scale: 1 },
  particles: { x: 0.5, y: 0.5, scale: 1 },
  audio: { x: 0.5, y: 0.5, scale: 1 },
};

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function loadTransforms() {
  if (typeof localStorage === 'undefined') return { ...BASE_TRANSFORMS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...BASE_TRANSFORMS };
    const parsed = JSON.parse(raw);
    return { ...BASE_TRANSFORMS, ...parsed };
  } catch (error) {
    console.warn('Unable to load saved layout', error);
    return { ...BASE_TRANSFORMS };
  }
}

function persistTransforms(transforms) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transforms));
  } catch (error) {
    console.warn('Unable to persist layout', error);
  }
}

function resolveKey(id) {
  if (id === 'texte' || id === 'tags' || id === 'emoji') return 'particles';
  if (id === 'image' || id === 'images' || id === 'bubbles') return 'bubbles';
  return id;
}

export function createState() {
  const state = {
    pulse: 0.4,
    energy: 0,
    exposureMode: 'screen',
    reverse: false,
    fadeBlack: 0,
    bubblesLoaded: 0,
    turbulence: { x: 0, y: 0, decay: 0.92 },
    tags: [...DEFAULT_TAGS],
    emojis: [...DEFAULT_EMOJIS],
    editing: false,
    selected: null,
    transforms: loadTransforms(),
  };

  return {
    get snapshot() {
      return {
        ...state,
        turbulence: { ...state.turbulence },
        transforms: { ...state.transforms },
      };
    },
    resolveKey,
    setEnergy(value) {
      state.energy = value;
    },
    smoothPulse(target, factor = 0.03) {
      state.pulse = Math.min(1.25, Math.max(0.1, state.pulse + (target - state.pulse) * factor));
    },
    nudgePulse(delta) {
      state.pulse = Math.min(1.25, Math.max(0.1, state.pulse + delta));
    },
    setExposureMode(mode) {
      state.exposureMode = mode;
    },
    toggleReverse() {
      state.reverse = !state.reverse;
    },
    setFade(value) {
      state.fadeBlack = Math.max(0, Math.min(1, value));
    },
    markBubbles(count) {
      state.bubblesLoaded = count;
    },
    setEditing(on) {
      state.editing = on;
    },
    setSelected(id) {
      state.selected = id;
    },
    getTransform(id) {
      const key = resolveKey(id);
      return state.transforms[key] || BASE_TRANSFORMS[key] || { x: 0.5, y: 0.5, scale: 1 };
    },
    updateTransform(id, next) {
      const key = resolveKey(id);
      const current = state.transforms[key] || BASE_TRANSFORMS[key];
      const merged = {
        ...current,
        ...next,
      };
      merged.x = clamp01(merged.x);
      merged.y = clamp01(merged.y);
      merged.scale = Math.min(2.4, Math.max(0.25, merged.scale || 1));
      state.transforms[key] = merged;
      persistTransforms(state.transforms);
    },
    resetTransform(id) {
      const key = resolveKey(id);
      state.transforms[key] = { ...BASE_TRANSFORMS[key] };
      persistTransforms(state.transforms);
    },
    pushTurbulence(x, y) {
      state.turbulence.x = x;
      state.turbulence.y = y;
      state.turbulence.decay = 0.9;
    },
    decayTurbulence() {
      state.turbulence.x *= state.turbulence.decay;
      state.turbulence.y *= state.turbulence.decay;
      state.turbulence.decay = 0.9 + (state.turbulence.decay - 0.9) * 0.96;
    },
    reset() {
      state.pulse = 0.4;
      state.energy = 0;
      state.reverse = false;
      state.fadeBlack = 0;
      state.bubblesLoaded = 0;
      state.turbulence = { x: 0, y: 0, decay: 0.92 };
      state.editing = false;
      state.selected = null;
      state.transforms = { ...BASE_TRANSFORMS };
      persistTransforms(state.transforms);
    },
  };
}
