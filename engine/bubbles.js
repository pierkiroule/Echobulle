const PALETTE = ['#8acbff', '#a3a6ff', '#ffdca8', '#f2a6ff', '#9ff3e0'];
const BASE_RADIUS = 56;
const GIF_MIN = 3;
const GIF_MAX = 7;
const GIF_FRAMES = 14;
const FRICTION = 0.985;
const BOUNCE_DAMPING = 0.92;
const SWITCH_INTERVAL = 10000;
const SWITCH_FADE = 1200;
const STAR_COUNT = 120;

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
  };
}

function placeBubbles(bubbles, width, height) {
  bubbles.forEach((b) => {
    let attempts = 0;
    let placed = false;
    while (!placed && attempts < 50) {
      b.x = randomRange(b.radius + 12, width - b.radius - 12);
      b.y = randomRange(b.radius + 12, height - b.radius - 12);
      placed = bubbles.every((other) => {
        if (other === b) return true;
        const dx = b.x - other.x;
        const dy = b.y - other.y;
        const dist = Math.hypot(dx, dy);
        return dist > b.radius + other.radius + 10;
      });
      attempts += 1;
    }
    if (!placed) {
      b.x = width * 0.5 + randomRange(-40, 40);
      b.y = height * 0.5 + randomRange(-40, 40);
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
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = url;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  await video.play().catch(() => {});
  await new Promise((resolve) => video.addEventListener('loadeddata', resolve, { once: true }));

  const duration = Math.max(1, video.duration || 6);
  const count = Math.floor(Math.random() * (GIF_MAX - GIF_MIN + 1)) + GIF_MIN;
  const fragmentsOut = [];

  async function captureFrame(time, radius, crop) {
    return new Promise((resolve) => {
      const handler = () => {
        resolve(maskFrame(video, crop.sx, crop.sy, crop.sw, crop.sh, radius, time));
      };
      video.currentTime = Math.min(duration - 0.05, Math.max(0.05, time));
      video.addEventListener('seeked', handler, { once: true });
    });
  }

  for (let i = 0; i < count; i += 1) {
    const start = randomRange(0, Math.max(0.2, duration - 0.6));
    const windowSize = randomRange(0.4, 1.8);
    const frames = [];
    const radius = randomRange(42, 72);
    const sw = Math.max(48, video.videoWidth * randomRange(0.22, 0.48));
    const sh = Math.max(48, video.videoHeight * randomRange(0.22, 0.48));
    const sx = randomRange(0, Math.max(1, video.videoWidth - sw));
    const sy = randomRange(0, Math.max(1, video.videoHeight - sh));
    const crop = { sx, sy, sw, sh };
    for (let f = 0; f < GIF_FRAMES; f += 1) {
      const t = start + (windowSize * f) / GIF_FRAMES;
      // eslint-disable-next-line no-await-in-loop
      const frame = await captureFrame(t, radius, crop);
      frames.push(frame);
    }
    fragmentsOut.push({ frames, radius });
  }

  video.pause();
  URL.revokeObjectURL(url);
  return fragmentsOut;
}

export function createBubblesEngine(state) {
  let bubbles = [];
  let bounds = { width: 600, height: 600 };
  let fragmentSets = [];
  let activeSet = -1;
  let switchStart = 0;
  let fading = false;
  let stars = [];

  function buildStars() {
    stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: randomRange(0.5, 1.4),
      twinkle: Math.random() * Math.PI * 2,
    }));
  }

  function reset() {
    bubbles = [];
    fragmentSets = [];
    activeSet = -1;
    switchStart = 0;
    fading = false;
    buildStars();
    placeBubbles(bubbles, bounds.width, bounds.height);
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

  function adoptSet(index) {
    const fragmentList = fragmentSets[index] || [];
    bubbles = fragmentList.map(({ frames, radius }) => {
      const bubble = createBubble(radius || BASE_RADIUS);
      bubble.type = 'gif';
      bubble.frames = frames;
      bubble.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      return bubble;
    });
    if (!bubbles.length) {
      bubbles.push(createBubble(BASE_RADIUS));
    }
    placeBubbles(bubbles, bounds.width, bounds.height);
  }

  function update(timestamp, pulse) {
    const t = timestamp * 0.001;
    if (fragmentSets.length > 1) {
      const elapsed = timestamp - switchStart;
      if (!fading && elapsed > SWITCH_INTERVAL) {
        fading = true;
        switchStart = timestamp;
      }
      if (fading) {
        const progress = Math.min(1, (timestamp - switchStart) / SWITCH_FADE);
        if (progress >= 1) {
          activeSet = (activeSet + 1) % fragmentSets.length;
          adoptSet(activeSet);
          fading = false;
          switchStart = timestamp;
        }
      }
    }

    bubbles.forEach((b, idx) => {
      b.vx += Math.sin(t * 0.6 + b.pulsePhase) * 0.002 * (0.6 + pulse);
      b.vy += Math.cos(t * 0.5 + b.pulsePhase) * 0.0025 * (0.6 + pulse);
      b.vx *= FRICTION;
      b.vy *= FRICTION;
      b.x += b.vx;
      b.y += b.vy;
      applyBounds(b);
      for (let j = idx + 1; j < bubbles.length; j += 1) {
        resolveCollision(b, bubbles[j]);
      }
    });
  }

  function drawStars(ctx, timestamp, pulse) {
    const { width, height } = bounds;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    stars.forEach((star) => {
      const tw = Math.sin(timestamp * 0.001 + star.twinkle) * 0.5 + 0.5;
      const alpha = 0.15 + (tw + pulse * 0.6) * 0.25;
      ctx.fillStyle = `rgba(160, 210, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x * width, star.y * height, star.size + pulse * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawBubble(ctx, bubble, timestamp, pulse) {
    const wobble = 1 + Math.sin(timestamp * 0.002 + bubble.pulsePhase) * 1.2;
    const opacityBase = 0.9 + Math.sin(timestamp * 0.0012 + bubble.opacityPhase) * 0.04;
    const alpha = opacityBase;
    if (alpha <= 0.01) return;

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
    ctx.lineWidth = 2.4 + (wobble - 1) * 0.7 + pulse * 0.4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.globalAlpha = alpha;
    ctx.stroke();
    ctx.restore();
  }

  function draw(ctx, timestamp, pulse) {
    drawStars(ctx, timestamp, pulse);
    bubbles.forEach((bubble) => drawBubble(ctx, bubble, timestamp, pulse));
    if (fading) {
      const progress = Math.min(1, (timestamp - switchStart) / SWITCH_FADE);
      const fadeAlpha = Math.sin(progress * Math.PI * 0.5);
      ctx.fillStyle = `rgba(4, 6, 12, ${0.4 + fadeAlpha * 0.6})`;
      ctx.fillRect(0, 0, bounds.width, bounds.height);
    }
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
  }

  async function ingestVideo(file) {
    const fragmentList = await videoFragmentsFromFile(file);
    fragmentSets.push(fragmentList);
    if (activeSet === -1) {
      activeSet = 0;
      adoptSet(activeSet);
      switchStart = performance.now();
    }
  }

  return { setBounds, update, draw, reset, impulse, ingestVideo };
}
