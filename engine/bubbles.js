const MAX_FRAGMENTS = 7;
const MIN_FRAGMENTS = 3;
const FRAME_COUNT = 12;
const EXPOSURE_MODES = ['screen', 'lighter', 'overlay', 'multiply'];

function createSurface(width, height) {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

export function perforateSource(width, height, isVideo = false) {
  const count = Math.floor(randRange(MIN_FRAGMENTS, MAX_FRAGMENTS + 1));
  const fragments = [];
  for (let i = 0; i < count; i += 1) {
    const w = randRange(width * 0.2, width * 0.55);
    const h = randRange(height * 0.2, height * 0.55);
    const x = randRange(width * 0.08, width - w - width * 0.08);
    const y = randRange(height * 0.08, height - h - height * 0.08);
    const frag = { x, y, w, h };
    if (isVideo) {
      frag.t0 = randRange(0, 0.7);
      frag.t1 = frag.t0 + randRange(0.1, 0.35);
    }
    fragments.push(frag);
  }
  return fragments;
}

function maskCircle(target, drawCb) {
  const ctx = target.getContext('2d');
  ctx.save();
  ctx.clearRect(0, 0, target.width, target.height);
  ctx.beginPath();
  ctx.arc(target.width / 2, target.height / 2, Math.min(target.width, target.height) / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  drawCb(ctx);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.arc(target.width / 2, target.height / 2, Math.min(target.width, target.height) / 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,1)';
  ctx.fill();
  ctx.restore();
}

export function stylizeFragment(baseCanvas, phase) {
  const size = Math.min(baseCanvas.width, baseCanvas.height);
  const target = createSurface(size, size);
  const wobble = 0.06 * Math.sin(phase * 0.6);
  const offsetX = (Math.sin(phase * 1.4) * 0.12 + wobble) * size;
  const offsetY = (Math.cos(phase * 1.1) * 0.12 - wobble) * size;
  const scale = 0.92 + 0.08 * Math.sin(phase * 0.9);
  maskCircle(target, (ctx) => {
    ctx.filter = 'blur(2px) saturate(1.25) contrast(1.08)';
    ctx.globalAlpha = 0.8;
    const w = baseCanvas.width * scale;
    const h = baseCanvas.height * scale;
    ctx.drawImage(baseCanvas, (size - w) / 2 + offsetX, (size - h) / 2 + offsetY, w, h);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.22;
    ctx.drawImage(baseCanvas, (size - w) / 2 - offsetX * 0.4, (size - h) / 2 - offsetY * 0.4, w, h);
  });
  return target;
}

export function extractFragments(source, fragments, isVideo = false) {
  return fragments.map((frag) => {
    const targetSize = Math.max(120, Math.min(320, Math.max(frag.w, frag.h) * 0.6));
    const canvas = createSurface(targetSize, targetSize);
    const ctx = canvas.getContext('2d');
    ctx.filter = 'blur(1px) saturate(1.2) contrast(1.05)';
    ctx.drawImage(source, frag.x, frag.y, frag.w, frag.h, 0, 0, targetSize, targetSize);
    return { canvas, frag };
  });
}

export function generateGifBubble(frames) {
  return {
    frames,
    duration: randRange(5000, 11000),
    mode: EXPOSURE_MODES[Math.floor(randRange(0, EXPOSURE_MODES.length))],
    reverse: Math.random() > 0.5,
    position: { x: clamp01(Math.random()), y: clamp01(Math.random()) },
    scale: randRange(0.4, 0.85),
    drift: { x: randRange(-0.12, 0.12), y: randRange(-0.12, 0.12) },
    phase: Math.random() * Math.PI * 2,
  };
}

async function captureVideoFrame(video, time) {
  if (time < 0) return null;
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };
    video.addEventListener('seeked', onSeeked);
    try {
      video.currentTime = Math.min(Math.max(0, time), Math.max(0.01, video.duration - 0.05));
    } catch (e) {
      video.removeEventListener('seeked', onSeeked);
      resolve();
    }
  });
}

async function buildFramesFromVideo(video, fragment) {
  const frames = [];
  const total = FRAME_COUNT;
  for (let i = 0; i < total; i += 1) {
    const t = fragment.t0 + ((fragment.t1 - fragment.t0) * i) / (total - 1);
    await captureVideoFrame(video, t * video.duration);
    const size = Math.max(120, Math.min(320, Math.max(fragment.w, fragment.h) * 0.6));
    const canvas = createSurface(size, size);
    const ctx = canvas.getContext('2d');
    ctx.filter = 'blur(1.2px) saturate(1.25) contrast(1.1)';
    ctx.drawImage(video, fragment.x, fragment.y, fragment.w, fragment.h, 0, 0, size, size);
    frames.push(canvas);
  }
  return frames;
}

export function createBubblesEngine(state) {
  let bubbles = [];

  function reset() {
    bubbles = [];
    state.markBubbles(0);
  }

  function drawBubble(ctx, bubble, width, height, timestamp, pulse, transform, editing) {
    if (!bubble.frames || bubble.frames.length === 0) return;
    const t = (timestamp + bubble.phase * 1000) % bubble.duration;
    const progress = t / bubble.duration;
    const frameIndex = Math.floor(progress * bubble.frames.length) % bubble.frames.length;
    const frame = bubble.frames[bubble.reverse ? bubble.frames.length - 1 - frameIndex : frameIndex];
    if (!frame) return;

    const scale = (transform?.scale ?? 1) * bubble.scale * (0.9 + pulse * 0.2);
    const cx = ((transform?.x ?? 0.5) + bubble.drift.x * pulse * 0.2) * width;
    const cy = ((transform?.y ?? 0.5) + bubble.drift.y * pulse * 0.2) * height;
    const size = Math.min(width, height) * scale * 0.9;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
    ctx.globalCompositeOperation = bubble.mode || state.snapshot.exposureMode;
    ctx.globalAlpha = (editing ? 0.55 : 0.7) + pulse * 0.2;
    const wobble = 0.04 * Math.sin(timestamp * 0.0006 + bubble.phase);
    ctx.drawImage(frame, cx - size / 2 + wobble * size, cy - size / 2 - wobble * size, size, size);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.18;
    ctx.drawImage(frame, cx - size / 2 - wobble * size * 0.6, cy - size / 2 + wobble * size * 0.6, size * 0.9, size * 0.9);
    ctx.restore();
  }

  function draw(ctx, width, height, timestamp, pulse, transform, editing) {
    bubbles.forEach((bubble) => drawBubble(ctx, bubble, width, height, timestamp, pulse, transform, editing));
  }

  async function fromImages(fileList) {
    const files = Array.from(fileList);
    const newBubbles = [];
    for (const file of files) {
      const bitmap = await createImageBitmap(file);
      const fragments = perforateSource(bitmap.width, bitmap.height, false);
      const mats = extractFragments(bitmap, fragments, false);
      mats.forEach((mat, idx) => {
        const frames = [];
        for (let i = 0; i < FRAME_COUNT; i += 1) {
          const phase = (i / FRAME_COUNT) * Math.PI * 2 + idx * 0.5;
          frames.push(stylizeFragment(mat.canvas, phase));
        }
        newBubbles.push(generateGifBubble(frames));
      });
    }
    bubbles = newBubbles;
    state.markBubbles(bubbles.length);
  }

  async function fromVideo(file) {
    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.src = URL.createObjectURL(file);
    await video.play().catch(() => {});
    video.pause();
    await new Promise((resolve) => {
      if (video.readyState >= 2) resolve();
      video.addEventListener('loadeddata', resolve, { once: true });
    });
    const fragments = perforateSource(video.videoWidth || 640, video.videoHeight || 360, true);
    const newBubbles = [];
    for (let i = 0; i < fragments.length; i += 1) {
      const fragment = fragments[i];
      const rawFrames = await buildFramesFromVideo(video, fragment);
      const frames = rawFrames.map((frame, idx) => stylizeFragment(frame, (idx / rawFrames.length) * Math.PI * 2 + i));
      newBubbles.push(generateGifBubble(frames));
    }
    URL.revokeObjectURL(video.src);
    bubbles = newBubbles;
    state.markBubbles(bubbles.length);
  }

  return { draw, fromImages, fromVideo, reset };
}
