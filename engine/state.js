export function createState() {
  const state = {
    audioLoaded: false,
    videoLoaded: false,
    playingAudio: false,
    playingVideo: false,
    lastAudioName: null,
    lastVideoName: null,
    imagesLoaded: 0,
    touches: 0,
    pulse: 0.4,
  };

  return {
    get snapshot() {
      return { ...state };
    },
    markAudioLoaded(name) {
      state.audioLoaded = true;
      state.lastAudioName = name;
      state.playingAudio = true;
    },
    markVideoLoaded(name) {
      state.videoLoaded = true;
      state.lastVideoName = name;
      state.playingVideo = true;
    },
    markAudioStopped() {
      state.playingAudio = false;
    },
    markVideoStopped() {
      state.playingVideo = false;
    },
    markParticlesTicked() {
      state.touches += 1;
    },
    markImagesLoaded(count) {
      state.imagesLoaded = count;
    },
    nudgePulse(delta) {
      state.pulse = Math.min(1.4, Math.max(0.12, state.pulse + delta));
    },
    smoothPulse(target, factor = 0.03) {
      const next = state.pulse + (target - state.pulse) * factor;
      state.pulse = Math.min(1.4, Math.max(0.12, next));
    },
    resetPulse() {
      state.pulse = 0.4;
    },
    reset() {
      state.audioLoaded = false;
      state.videoLoaded = false;
      state.playingAudio = false;
      state.playingVideo = false;
      state.lastAudioName = null;
      state.lastVideoName = null;
      state.imagesLoaded = 0;
      state.touches = 0;
      state.pulse = 0.4;
    },
  };
}
