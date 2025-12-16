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
        r: 1.5 + Math.random() * 2.5,
        hue: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        drift: (0.4 + Math.random() * 0.6) * (Math.random() > 0.5 ? 1 : -1),
        speed: 4 + Math.random() * 12,
        sway: Math.random() * Math.PI * 2,
      });
    }
  }

  function update(timestamp) {
    if (!width || !height) return;
    const dt = lastTime ? Math.min(32, timestamp - lastTime) / 1000 : 0;
    lastTime = timestamp;

    particles.forEach((p) => {
      const driftX = Math.sin(timestamp * 0.00018 + p.sway) * 0.45;
      const driftY = Math.cos(timestamp * 0.00012 + p.sway) * 0.35;

      p.x += driftX * p.speed * dt;
      p.y += driftY * p.speed * dt;

      if (impulse) {
        const dx = p.x - impulse.x;
        const dy = p.y - impulse.y;
        const dist = Math.max(12, Math.hypot(dx, dy));
        p.x += (dx / dist) * impulse.power * 0.6;
        p.y += (dy / dist) * impulse.power * 0.6;
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

  function draw(ctx) {
    if (!width || !height) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.8;
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.fillStyle = p.hue;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function turbulence(x, y) {
    impulse = { x, y, power: 12 + Math.random() * 10 };
    state.markParticlesTicked();
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
