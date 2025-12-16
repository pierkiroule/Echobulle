const DEFAULT_TAGS = ['#bulle', '#souffle', '#lenteur', '#halo', '#onde', '#flux', '#calme'];
const EMOJI_POOL = ['🌊', '🌙', '🔥', '🪨', '🌫️', '🌬️', '✨', '💧'];

function hashEmoji(word) {
  let sum = 0;
  for (let i = 0; i < word.length; i += 1) {
    sum = (sum + word.charCodeAt(i) * 17 + i * 13) % 9973;
  }
  return EMOJI_POOL[sum % EMOJI_POOL.length];
}

export function createState() {
  const state = {
    pulse: 0.35,
    energy: 0,
    tags: [...DEFAULT_TAGS],
    emojis: DEFAULT_TAGS.map((tag) => hashEmoji(tag)),
    tagIndex: 0,
    tagInterval: 5200,
    lastTagSwitch: 0,
  };

  return {
    get snapshot() {
      return { ...state, tags: [...state.tags], emojis: [...state.emojis] };
    },
    emojiFor(tag) {
      return hashEmoji(tag || '');
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
    setHashtags(hashtags = []) {
      const list = hashtags.length ? hashtags : [...DEFAULT_TAGS];
      state.tags = [...list];
      state.emojis = state.tags.map((tag) => hashEmoji(tag));
      state.tagIndex = 0;
      state.lastTagSwitch = 0;
    },
    reset() {
      state.pulse = 0.35;
      state.energy = 0;
      state.tagIndex = 0;
      state.tagInterval = 5200;
      state.lastTagSwitch = 0;
      state.tags = [...DEFAULT_TAGS];
      state.emojis = DEFAULT_TAGS.map((tag) => hashEmoji(tag));
    },
  };
}
