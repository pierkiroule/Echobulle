import { BunnyEngine, VideoClip } from 'mediabunny';

export function createVideoEngine(state) {
  const bunny = new BunnyEngine();
  let video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';
  video.preload = 'auto';

  let ready = false;
  let clip = null;
  let lastTime = 0;

  async function loadFile(file) {
    clip = new VideoClip(file);
    const media = clip.mediaElement || video;
    video = media;
    media.muted = true;
    media.loop = true;
    media.playsInline = true;
    media.crossOrigin = 'anonymous';
    ready = false;
    const onReady = () => {
      ready = true;
    };
    media.addEventListener('loadeddata', onReady, { once: true });
    media.src = clip.src || URL.createObjectURL(file);
    media.load();
    await media.play().catch(() => {});
    media.pause();
  }

  function resume() {
    if (!ready) return;
    video.play().catch(() => {});
  }

  function draw(ctx, width, height, timestamp) {
    if (!ready || video.readyState < 2) return;
    const dt = lastTime ? (timestamp - lastTime) / 1000 : 0;
    lastTime = timestamp;
    if (state.snapshot.reverse && dt > 0) {
      const back = Math.max(0, video.currentTime - dt);
      video.currentTime = back;
      if (back <= 0) {
        video.currentTime = Math.max(0, video.duration - 0.05);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(video, 0, 0, width, height);
    if (state.snapshot.fadeBlack > 0.001) {
      ctx.fillStyle = `rgba(0,0,0,${state.snapshot.fadeBlack})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  function reset() {
    ready = false;
    lastTime = 0;
    clip = null;
    video.pause();
    video.removeAttribute('src');
  }

  return { loadFile, draw, resume, reset, get element() { return video; } };
}
