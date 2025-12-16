const DEFAULT_TAGS = ['bulle', 'souffle', 'lenteur', 'halo', 'onde', 'flux'];
const DEFAULT_EMOJIS = ['●', '○', '◐', '◑', '◒', '◓'];

export function createState() {
  const state = {
    pulse: 0.4,
    energy: 0,
    exposureMode: 'screen',
    reverse: false,
    fadeBlack: 0,
    imagesLoaded: 0,
    turbulence: { x: 0, y: 0, decay: 0.92 },
    tags: [...DEFAULT_TAGS],
    emojis: [...DEFAULT_EMOJIS],
  };

  return {
    get snapshot() {
      return { ...state, turbulence: { ...state.turbulence } };
    },
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
    markImages(count) {
      state.imagesLoaded = count;
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
      state.imagesLoaded = 0;
      state.turbulence = { x: 0, y: 0, decay: 0.92 };
    },
  };
}
