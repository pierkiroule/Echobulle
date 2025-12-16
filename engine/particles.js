const PALETTE = [
  'rgba(255,255,255,0.22)',
  'rgba(106,213,255,0.24)',
  'rgba(255,199,128,0.2)',
];

export function createParticlesEngine(state) {
  const particles = [];
  let width = 0;
  let height = 0;
  let lastTime = 0;
  let impulse = null;

  function setBounds(w, h) {
    width = w;
    height = h;
    initParticles(120);
  }

  function initParticles(count = 120) {
    particles.length = 0;
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 1.5 + Math.random() * 2.5,
        hue: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        sway: Math.random() * Math.PI * 2,
        label: Math.random() > 0.7 ? '·' : '',
      });
    }
  }

  function update(timestamp, pulse, attractorPositions = []) {
    if (!width || !height) return;
    const dt = lastTime ? Math.min(32, timestamp - lastTime) / 1000 : 0;
    lastTime = timestamp;

    particles.forEach((p) => {
      const driftX = Math.sin(timestamp * 0.00018 + p.sway) * (0.6 + pulse * 0.3);
      const driftY = Math.cos(timestamp * 0.00012 + p.sway) * (0.5 + pulse * 0.25);
      p.vx += driftX * dt;
      p.vy += driftY * dt;

      if (attractorPositions.length > 0) {
        const target = attractorPositions[Math.floor(Math.random() * attractorPositions.length)];
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        const dist = Math.max(12, Math.hypot(dx, dy));
        p.vx += (dx / dist) * (0.002 + pulse * 0.004);
        p.vy += (dy / dist) * (0.002 + pulse * 0.004);
      }

      p.vx *= 0.96 - pulse * 0.02;
      p.vy *= 0.96 - pulse * 0.02;

      const speed = Math.min(0.9 + pulse * 0.6, Math.hypot(p.vx, p.vy));
      if (speed > 0.9) {
        const s = (0.9 + pulse * 0.6) / speed;
        p.vx *= s;
        p.vy *= s;
      }

      p.x += p.vx;
      p.y += p.vy;

      if (impulse) {
        const dx = p.x - impulse.x;
        const dy = p.y - impulse.y;
        const dist = Math.max(12, Math.hypot(dx, dy));
        p.vx += (dx / dist) * impulse.power * 0.08;
        p.vy += (dy / dist) * impulse.power * 0.08;
      }

      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;
    });

    if (impulse) {
      impulse.power *= 0.9;
      if (impulse.power < 0.1) impulse = null;
    }
  }

  function draw(ctx, pulse) {
    if (!width || !height) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.6 + pulse * 0.25;
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.fillStyle = p.hue;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      if (p.label) {
        ctx.font = '10px "Inter", system-ui, sans-serif';
        ctx.globalAlpha = 0.4 + pulse * 0.15;
        ctx.fillText(p.label, p.x, p.y - p.r * 1.2);
        ctx.globalAlpha = 0.6 + pulse * 0.25;
      }
    });
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function turbulence(x, y, pulse) {
    impulse = { x, y, power: 12 + Math.random() * 10 };
    state.markParticlesTicked();
    state.nudgePulse(0.08 + pulse * 0.05);
  }

  function reset() {
    initParticles(120);
    impulse = null;
  }

  return {
    setBounds,
    update,
    draw,
    turbulence,
    reset,
  };
}
