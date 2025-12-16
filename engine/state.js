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
    reset() {
      state.audioLoaded = false;
      state.videoLoaded = false;
      state.playingAudio = false;
      state.playingVideo = false;
      state.lastAudioName = null;
      state.lastVideoName = null;
      state.imagesLoaded = 0;
      state.touches = 0;
    },
  };
}
