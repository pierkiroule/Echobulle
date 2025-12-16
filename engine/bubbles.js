const PALETTE = ['#8acbff', '#a3a6ff', '#ffdca8', '#f2a6ff', '#9ff3e0'];
const BASE_RADIUS = 46;
const TAG_RADIUS = 64;
const FRICTION = 0.985;
const BOUNCE_DAMPING = 0.92;

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function createBubble(label, radius) {
  return {
    label,
    radius,
    x: 0,
    y: 0,
    vx: randomRange(-0.25, 0.25),
    vy: randomRange(-0.25, 0.25),
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    pulsePhase: Math.random() * Math.PI * 2,
    type: 'emoji',
    opacityPhase: Math.random() * Math.PI * 2,
  };
}

function createTagBubble() {
  const bubble = createBubble('', TAG_RADIUS);
  bubble.type = 'tag';
  bubble.alpha = 0;
  bubble.visible = false;
  return bubble;
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

export function createBubblesEngine(state) {
  let bubbles = [];
  let bounds = { width: 600, height: 600 };
  let tagBubble = createTagBubble();
  let tagSwitchTime = 0;

  function reset() {
    bubbles = state.snapshot.emojis.map((emoji) => {
      const bubble = createBubble(emoji, BASE_RADIUS);
      bubble.type = 'emoji';
      return bubble;
    });
    tagBubble = createTagBubble();
    tagSwitchTime = 0;
    bubbles.push(tagBubble);
    placeBubbles(bubbles, bounds.width, bounds.height);
  }

  function setBounds(width, height) {
    bounds = { width, height };
    if (bubbles.length === 0) {
      reset();
    } else {
      placeBubbles(bubbles, width, height);
    }
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

    const kx = (a.vx - b.vx);
    const ky = (a.vy - b.vy);
    const p = (2 * (nx * kx + ny * ky)) / 2;
    a.vx = (a.vx - p * nx) * BOUNCE_DAMPING;
    a.vy = (a.vy - p * ny) * BOUNCE_DAMPING;
    b.vx = (b.vx + p * nx) * BOUNCE_DAMPING;
    b.vy = (b.vy + p * ny) * BOUNCE_DAMPING;
  }

  function update(timestamp, pulse) {
    const t = timestamp * 0.001;
    const readyTag = state.advanceTag(timestamp);
    if (readyTag) {
      tagBubble.visible = true;
      tagBubble.label = state.currentTag();
      tagSwitchTime = timestamp;
    }
    const tagAge = timestamp - tagSwitchTime;
    if (tagBubble.visible) {
      const fadeIn = Math.min(1, tagAge / 800);
      const fadeOut = Math.max(0, 1 - Math.max(0, tagAge - state.snapshot.tagInterval + 1200) / 800);
      tagBubble.alpha = Math.min(fadeIn, fadeOut);
      if (fadeOut <= 0) {
        tagBubble.visible = false;
        tagBubble.alpha = 0;
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

  function drawBubble(ctx, bubble, timestamp, pulse) {
    const wobble = 1 + Math.sin(timestamp * 0.002 + bubble.pulsePhase) * 1.2;
    const opacityBase = 0.85 + Math.sin(timestamp * 0.0012 + bubble.opacityPhase) * 0.05;
    const alpha = bubble.type === 'tag' ? (bubble.visible ? bubble.alpha * opacityBase : 0) : opacityBase;
    if (alpha <= 0.01) return;

    ctx.save();
    ctx.translate(bubble.x, bubble.y);
    ctx.beginPath();
    ctx.arc(0, 0, bubble.radius, 0, Math.PI * 2);
    ctx.fillStyle = bubble.color;
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.lineWidth = 2.5 + (wobble - 1) * 0.8 + pulse * 0.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.stroke();
    ctx.font = bubble.type === 'tag' ? '16px "Inter", sans-serif' : '30px "Apple Color Emoji", "Segoe UI Emoji"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    const label = bubble.type === 'tag' ? bubble.label : bubble.label;
    ctx.fillText(label, 0, -1);
    ctx.restore();
  }

  function draw(ctx, timestamp, pulse) {
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
  }

  return { setBounds, update, draw, reset, impulse };
}
