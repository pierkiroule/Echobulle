const DEFAULT_TAGS = ['bulle', 'souffle', 'lenteur', 'halo', 'onde', 'flux', 'calme'];
const DEFAULT_EMOJIS = ['🌊', '🌙', '🔥', '🪨', '🌫️'];

export function createState() {
  const state = {
    pulse: 0.35,
    energy: 0,
    tags: [...DEFAULT_TAGS],
    emojis: [...DEFAULT_EMOJIS],
    tagIndex: 0,
    tagInterval: 5200,
    lastTagSwitch: 0,
  };

  return {
    get snapshot() {
      return { ...state, tags: [...state.tags], emojis: [...state.emojis] };
    },
    setEnergy(value) {
      state.energy = value;
    },
    smoothPulse(target, factor = 0.025) {
      state.pulse = Math.min(1.1, Math.max(0.05, state.pulse + (target - state.pulse) * factor));
    },
    nudgePulse(delta) {
      state.pulse = Math.min(1.1, Math.max(0.05, state.pulse + delta));
    },
    advanceTag(timestamp) {
      if (timestamp - state.lastTagSwitch < state.tagInterval) return false;
      state.tagIndex = (state.tagIndex + 1) % state.tags.length;
      state.tagInterval = 4000 + Math.random() * 2000;
      state.lastTagSwitch = timestamp;
      return true;
    },
    currentTag() {
      return state.tags[state.tagIndex % state.tags.length];
    },
    reset() {
      state.pulse = 0.35;
      state.energy = 0;
      state.tagIndex = 0;
      state.tagInterval = 5200;
      state.lastTagSwitch = 0;
    },
  };
}
