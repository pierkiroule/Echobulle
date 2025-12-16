import { VideoClip } from 'mediabunny';

const PALETTE = ['#8acbff', '#a3a6ff', '#ffdca8', '#f2a6ff', '#9ff3e0'];
const BASE_RADIUS = 56;
const GIF_MIN = 3;
const GIF_MAX = 7;
const GIF_FRAMES = 14;
const FRICTION = 0.984;
const BOUNCE_DAMPING = 0.9;
const PARTICLE_COUNT = 140;
const PARTICLE_DECAY = 0.986;
const FIELD_SCALE = 0.0008;
const MAX_BUBBLES = 32;

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function createBubble(radius) {
  return {
    radius,
    x: 0,
    y: 0,
    vx: randomRange(-0.25, 0.25),
    vy: randomRange(-0.25, 0.25),
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    pulsePhase: Math.random() * Math.PI * 2,
    type: 'gif',
    opacityPhase: Math.random() * Math.PI * 2,
    frames: null,
    frameOffset: Math.floor(Math.random() * GIF_FRAMES),
    sourceId: '',
  };
}

function placeBubbles(bubbles, width, height) {
  bubbles.forEach((b) => {
    let attempts = 0;
    let placed = false;
    while (!placed && attempts < 60) {
      b.x = randomRange(b.radius + 10, Math.max(b.radius + 10, width - b.radius - 10));
      b.y = randomRange(b.radius + 10, Math.max(b.radius + 10, height - b.radius - 10));
      placed = bubbles.every((other) => {
        if (other === b) return true;
        const dx = b.x - other.x;
        const dy = b.y - other.y;
        const dist = Math.hypot(dx, dy);
        return dist > b.radius + other.radius + 6;
      });
      attempts += 1;
    }
    if (!placed) {
      b.x = width * 0.5 + randomRange(-60, 60);
      b.y = height * 0.5 + randomRange(-60, 60);
    }
  });
}

function maskFrame(source, sx, sy, sw, sh, radius, jitterPhase = 0) {
  const size = Math.round(radius * 2);
  const off = document.createElement('canvas');
  off.width = size;
  off.height = size;
  const c = off.getContext('2d');
  const wobble = 1 + Math.sin(jitterPhase) * 0.04;
  const dx = (Math.sin(jitterPhase * 0.8) * 0.06 + 0.12) * radius;
  const dy = (Math.cos(jitterPhase * 0.7) * 0.05 - 0.08) * radius;

  c.save();
  c.translate(size / 2, size / 2);
  c.beginPath();
  c.arc(0, 0, radius, 0, Math.PI * 2);
  c.clip();
  c.globalAlpha = 0.82;
  c.filter = 'saturate(1.05) contrast(1.06)';
  c.drawImage(
    source,
    sx,
    sy,
    sw,
    sh,
    -radius + dx,
    -radius + dy,
    radius * 2 * wobble,
    radius * 2 * wobble,
  );
  c.restore();

  return off;
}

async function videoFragmentsFromFile(file) {
  const clip = new VideoClip(file);
  const video = clip.mediaElement;
  const url = clip.src;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';
  video.preload = 'auto';

  if (video.readyState < 1) {
    await new Promise((resolve) => video.addEventListener('loadedmetadata', resolve, { once: true }));
  }

  if (video.readyState < 2) {
    await new Promise((resolve) => video.addEventListener('loadeddata', resolve, { once: true }));
  }

  await video.play().catch(() => {});

  const duration = Math.max(1, video.duration || 6);
  const count = Math.floor(Math.random() * (GIF_MAX - GIF_MIN + 1)) + GIF_MIN;
  const fragmentsOut = [];

  async function captureFrame(time, radius, crop) {
    const targetTime = Math.min(duration - 0.05, Math.max(0.05, time));
    return new Promise((resolve) => {
      let settled = false;
      const finish = (frame) => {
        if (settled) return;
        settled = true;
        resolve(frame);
      };

      const handler = () => {
        if (video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
          finish(null);
          return;
        }
        finish(maskFrame(video, crop.sx, crop.sy, crop.sw, crop.sh, radius, time));
      };

      const timeout = setTimeout(() => finish(null), 900);
      video.currentTime = targetTime;
      video.addEventListener(
        'seeked',
        () => {
          clearTimeout(timeout);
          handler();
        },
        { once: true },
      );
    });
  }

  for (let i = 0; i < count; i += 1) {
    const start = randomRange(0, Math.max(0.2, duration - 0.6));
    const windowSize = randomRange(0.4, 1.8);
    const frames = [];
    const radius = randomRange(42, 76);
    const sw = Math.max(48, video.videoWidth * randomRange(0.22, 0.48));
    const sh = Math.max(48, video.videoHeight * randomRange(0.22, 0.48));
    const sx = randomRange(0, Math.max(1, video.videoWidth - sw));
    const sy = randomRange(0, Math.max(1, video.videoHeight - sh));
    const crop = { sx, sy, sw, sh };
    for (let f = 0; f < GIF_FRAMES; f += 1) {
      const t = start + (windowSize * f) / GIF_FRAMES;
      // eslint-disable-next-line no-await-in-loop
      const frame = await captureFrame(t, radius, crop);
      if (frame) frames.push(frame);
    }
    if (frames.length) {
      fragmentsOut.push({ frames, radius });
    }
  }

  if (!fragmentsOut.length && video.videoWidth > 0 && video.videoHeight > 0) {
    const radius = randomRange(42, 72);
    const fallback = maskFrame(
      video,
      0,
      0,
      Math.max(64, video.videoWidth * 0.5),
      Math.max(64, video.videoHeight * 0.5),
      radius,
      performance.now() * 0.001,
    );
    fragmentsOut.push({ frames: [fallback], radius });
  }

  video.pause();
  URL.revokeObjectURL(url);
  return fragmentsOut;
}

export function createBubblesEngine(state) {
  let bubbles = [];
  let bounds = { width: 600, height: 600 };
  let fragments = [];
  const particles = new Array(PARTICLE_COUNT).fill(null).map(() => ({
    x: Math.random() * bounds.width,
    y: Math.random() * bounds.height,
    vx: randomRange(-0.2, 0.2),
    vy: randomRange(-0.2, 0.2),
    life: randomRange(1200, 3200),
    hue: randomRange(180, 220),
  }));

  function reset() {
    bubbles = [];
    fragments = [];
    particles.forEach((p) => {
      p.x = Math.random() * bounds.width;
      p.y = Math.random() * bounds.height;
      p.vx = randomRange(-0.2, 0.2);
      p.vy = randomRange(-0.2, 0.2);
      p.life = randomRange(1200, 3200);
      p.hue = randomRange(180, 220);
    });
  }

  function setBounds(width, height) {
    bounds = { width, height };
    placeBubbles(bubbles, width, height);
  }

  function applyBounds(bubble) {
    if (bubble.x - bubble.radius < 0) {
      bubble.x = bubble.radius;
      bubble.vx = Math.abs(bubble.vx) * BOUNCE_DAMPING;
    }
    if (bubble.x + bubble.radius > bounds.width) {
      bubble.x = bounds.width - bubble.radius;
      bubble.vx = -Math.abs(bubble.vx) * BOUNCE_DAMPING;
    }
    if (bubble.y - bubble.radius < 0) {
      bubble.y = bubble.radius;
      bubble.vy = Math.abs(bubble.vy) * BOUNCE_DAMPING;
    }
    if (bubble.y + bubble.radius > bounds.height) {
      bubble.y = bounds.height - bubble.radius;
      bubble.vy = -Math.abs(bubble.vy) * BOUNCE_DAMPING;
    }
  }

  function resolveCollision(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.max(0.001, Math.hypot(dx, dy));
    const minDist = a.radius + b.radius;
    if (dist >= minDist) return;

    const overlap = (minDist - dist) * 0.5;
    const nx = dx / dist;
    const ny = dy / dist;
    a.x -= nx * overlap;
    a.y -= ny * overlap;
    b.x += nx * overlap;
    b.y += ny * overlap;

    const kx = a.vx - b.vx;
    const ky = a.vy - b.vy;
    const p = (2 * (nx * kx + ny * ky)) / 2;
    a.vx = (a.vx - p * nx) * BOUNCE_DAMPING;
    a.vy = (a.vy - p * ny) * BOUNCE_DAMPING;
    b.vx = (b.vx + p * nx) * BOUNCE_DAMPING;
    b.vy = (b.vy + p * ny) * BOUNCE_DAMPING;
  }

  function rebuildBubbles() {
    const limited = fragments.slice(-MAX_BUBBLES);
    bubbles = limited.map((frag, idx) => {
      const bubble = createBubble(frag.radius || BASE_RADIUS);
      bubble.frames = frag.frames;
      bubble.sourceId = frag.id;
      bubble.pulsePhase += idx * 0.37;
      return bubble;
    });
    if (!bubbles.length) {
      bubbles.push(createBubble(BASE_RADIUS));
    }
    placeBubbles(bubbles, bounds.width, bounds.height);
  }

  function update(timestamp, pulse) {
    const t = timestamp * 0.001;
    bubbles.forEach((b, idx) => {
      const flowX = Math.sin(t * 0.35 + b.pulsePhase) + Math.cos((b.y * FIELD_SCALE + t * 0.2));
      const flowY = Math.cos(t * 0.38 + b.pulsePhase) - Math.sin((b.x * FIELD_SCALE + t * 0.22));
      b.vx += flowX * 0.006 * (0.6 + pulse * 0.8);
      b.vy += flowY * 0.0065 * (0.6 + pulse * 0.8);
      b.vx *= FRICTION;
      b.vy *= FRICTION;
      b.x += b.vx;
      b.y += b.vy;
      applyBounds(b);
      for (let j = idx + 1; j < bubbles.length; j += 1) {
        resolveCollision(b, bubbles[j]);
      }
    });

    particles.forEach((p) => {
      const flowX = Math.sin((p.y + t * 100) * FIELD_SCALE) * (0.8 + pulse * 0.7);
      const flowY = Math.cos((p.x - t * 80) * FIELD_SCALE) * (0.8 + pulse * 0.7);
      p.vx += flowX * 0.18;
      p.vy += flowY * 0.18;
      p.vx *= PARTICLE_DECAY;
      p.vy *= PARTICLE_DECAY;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 16;

      if (p.x < -12 || p.x > bounds.width + 12 || p.y < -12 || p.y > bounds.height + 12 || p.life <= 0) {
        p.x = Math.random() * bounds.width;
        p.y = Math.random() * bounds.height;
        p.vx = randomRange(-0.3, 0.3);
        p.vy = randomRange(-0.3, 0.3);
        p.life = randomRange(1200, 3200);
        p.hue = randomRange(180, 220);
      }
    });
  }

  function drawParticles(ctx, timestamp, pulse) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    particles.forEach((p, idx) => {
      const alpha = 0.12 + (idx % 5) * 0.02 + pulse * 0.08;
      ctx.fillStyle = `hsla(${p.hue}, 80%, ${62 + pulse * 10}%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.2 + (idx % 3) * 0.6 + pulse * 0.8, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawBubble(ctx, bubble, timestamp, pulse) {
    const wobble = 1 + Math.sin(timestamp * 0.002 + bubble.pulsePhase) * 0.5;
    const alpha = 0.9 + Math.sin(timestamp * 0.0012 + bubble.opacityPhase) * 0.05;
    ctx.save();
    ctx.translate(bubble.x, bubble.y);
    ctx.beginPath();
    ctx.arc(0, 0, bubble.radius, 0, Math.PI * 2);
    ctx.clip();
    if (bubble.type === 'gif' && bubble.frames?.length) {
      const frameIndex = Math.floor(((timestamp * 0.012 + bubble.frameOffset) % bubble.frames.length + bubble.frames.length) % bubble.frames.length);
      ctx.globalAlpha = alpha * 0.96;
      ctx.drawImage(bubble.frames[frameIndex], -bubble.radius, -bubble.radius, bubble.radius * 2, bubble.radius * 2);
    } else {
      ctx.fillStyle = bubble.color;
      ctx.globalAlpha = alpha * 0.92;
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(bubble.x, bubble.y);
    ctx.beginPath();
    ctx.arc(0, 0, bubble.radius, 0, Math.PI * 2);
    ctx.lineWidth = 2.2 + (wobble - 1) * 0.8 + pulse * 0.6;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.globalAlpha = alpha;
    ctx.stroke();
    ctx.restore();
  }

  function draw(ctx, timestamp, pulse) {
    ctx.fillStyle = 'rgba(5, 7, 12, 0.1)';
    ctx.fillRect(0, 0, bounds.width, bounds.height);
    drawParticles(ctx, timestamp, pulse);
    bubbles.forEach((bubble) => drawBubble(ctx, bubble, timestamp, pulse));
  }

  function impulse(x, y) {
    bubbles.forEach((b) => {
      const dx = b.x - x;
      const dy = b.y - y;
      const dist = Math.max(12, Math.hypot(dx, dy));
      const force = 1.4 / dist;
      b.vx += (dx / dist) * force;
      b.vy += (dy / dist) * force;
    });
    particles.forEach((p) => {
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.max(14, Math.hypot(dx, dy));
      const force = 2.2 / dist;
      p.vx += (dx / dist) * force;
      p.vy += (dy / dist) * force;
    });
  }

  async function ingestVideo(file) {
    const fragmentList = await videoFragmentsFromFile(file);
    const id = `${file.name}-${performance.now().toFixed(0)}`;
    fragmentList.forEach((frag) => {
      fragments.push({ ...frag, id });
    });
    if (fragments.length > MAX_BUBBLES) {
      fragments.splice(0, fragments.length - MAX_BUBBLES);
    }
    rebuildBubbles();
  }

  return { setBounds, update, draw, reset, impulse, ingestVideo };
}
