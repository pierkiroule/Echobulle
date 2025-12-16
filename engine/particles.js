const PARTICLE_COUNT = 60;
const TAU = Math.PI * 2;

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function createParticle(width, height, tags, emojis) {
  const label = Math.random() > 0.4
    ? emojis[Math.floor(Math.random() * emojis.length)]
    : tags[Math.floor(Math.random() * tags.length)];
  return {
    label,
    x: Math.random() * width,
    y: Math.random() * height,
    vx: randomRange(-0.2, 0.2),
    vy: randomRange(-0.2, 0.2),
    size: randomRange(12, 26),
    hue: randomRange(180, 260),
    phase: Math.random() * TAU,
  };
}

export function createParticlesEngine(state) {
  let particles = [];
  let bounds = { width: 600, height: 600 };

  function setBounds(width, height) {
    bounds = { width, height };
    if (particles.length === 0) {
      for (let i = 0; i < PARTICLE_COUNT; i += 1) {
        particles.push(createParticle(width, height, state.snapshot.tags, state.snapshot.emojis));
      }
    }
  }

  function turbulence(x, y, pulse) {
    particles.forEach((p) => {
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.max(20, Math.hypot(dx, dy));
      const force = (pulse + 0.2) * 60 / dist;
      p.vx += (dx / dist) * force;
      p.vy += (dy / dist) * force;
    });
  }

  function update(timestamp, pulse, turbulenceVec) {
    const { width, height } = bounds;
    const t = timestamp * 0.001;
    particles.forEach((p, index) => {
      const orbit = 0.15 + pulse * 0.2;
      p.vx += Math.cos(t + p.phase + index * 0.1) * 0.002 * (1 + pulse);
      p.vy += Math.sin(t * 0.8 + p.phase * 0.7) * 0.0025 * (1 + pulse);
      p.vx += turbulenceVec.x * 0.0025;
      p.vy += turbulenceVec.y * 0.0025;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -60) p.x = width + 40;
      if (p.x > width + 60) p.x = -40;
      if (p.y < -60) p.y = height + 40;
      if (p.y > height + 60) p.y = -40;
      p.hue += orbit;
    });
    state.decayTurbulence();
  }

  function draw(ctx, pulse) {
    ctx.save();
    ctx.font = '14px "Inter", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    particles.forEach((p) => {
      const alpha = 0.45 + pulse * 0.25;
      const size = p.size * (0.8 + pulse * 0.4);
      ctx.fillStyle = `hsla(${p.hue}, 70%, ${48 + pulse * 12}%, ${alpha})`;
      ctx.shadowColor = 'rgba(106, 213, 255, 0.15)';
      ctx.shadowBlur = 14 * (0.6 + pulse * 0.6);
      ctx.fillText(p.label, p.x, p.y);
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 0.1, 0, TAU);
      ctx.fill();
    });
    ctx.restore();
  }

  function reset() {
    particles = [];
  }

  return { setBounds, update, draw, turbulence, reset };
}
