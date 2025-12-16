export function createState() {
  const state = {
    audioLoaded: false,
    videoLoaded: false,
    playingAudio: false,
    playingVideo: false,
    lastAudioName: null,
    lastVideoName: null,
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
    reset() {
      state.audioLoaded = false;
      state.videoLoaded = false;
      state.playingAudio = false;
      state.playingVideo = false;
      state.lastAudioName = null;
      state.lastVideoName = null;
    },
  };
}
