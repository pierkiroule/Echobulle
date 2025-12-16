export class BunnyEngine {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

export class VideoClip {
  constructor(file) {
    this.file = file;
    this.src = URL.createObjectURL(file);
    this.mediaElement = document.createElement('video');
    this.mediaElement.src = this.src;
    this.mediaElement.muted = true;
    this.mediaElement.loop = true;
    this.mediaElement.playsInline = true;
    this.mediaElement.crossOrigin = 'anonymous';
    this.mediaElement.preload = 'auto';
  }
}

export class AudioClip {
  constructor(file) {
    this.file = file;
    this.src = URL.createObjectURL(file);
    this.mediaElement = new Audio();
    this.mediaElement.src = this.src;
    this.mediaElement.loop = true;
    this.mediaElement.crossOrigin = 'anonymous';
    this.mediaElement.preload = 'auto';
  }
}
