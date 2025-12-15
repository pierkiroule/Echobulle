import { useEffect, useRef, useState } from 'react';

const attractors = [
  { id: 'calme', label: 'calme', color: '#7fb4ff', strength: 0.6, pos: { x: 0.2, y: 0.35 } },
  { id: 'tension', label: 'tension', color: '#f2b6b6', strength: 1.1, pos: { x: 0.5, y: 0.15 } },
  { id: 'mouvement', label: 'mouvement', color: '#c1f0d5', strength: 0.85, pos: { x: 0.72, y: 0.48 } },
  { id: 'retrait', label: 'retrait', color: '#d1c8ff', strength: 0.5, pos: { x: 0.28, y: 0.75 } },
  { id: 'elan', label: 'élan', color: '#f4e9a3', strength: 0.95, pos: { x: 0.8, y: 0.78 } },
];

export default function EchoCanvas({ tags, onMetrics, onSnapshotReady }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const calmFrames = useRef(0);
  const [pictos, setPictos] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    if (!tags || tags.length === 0) {
      particlesRef.current = [];
      setPictos([]);
      return;
    }
    const canvas = canvasRef.current;
    const { width, height } = canvas;
    particlesRef.current = tags.map((tag, index) => ({
      ...tag,
      x: (0.2 + 0.6 * Math.random()) * width,
      y: (0.2 + 0.6 * Math.random()) * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      charge: 0.4 + (index % 3) * 0.15,
    }));
  }, [tags]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const tick = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      renderBackdrop(ctx, width, height);

      const particles = particlesRef.current;
      const pointer = pointerRef.current;
      const metrics = evolve(particles, width, height, pointer);
      drawAttractors(ctx, width, height);
      drawParticles(ctx, particles);
      drawPictos(ctx, pictos);

      calmFrames.current = metrics.avgSpeed < 0.015 ? calmFrames.current + 1 : 0;
      if (calmFrames.current > 420 && particles.length > 3) {
        setPictos((prev) => [...prev, buildPicto(particles, width, height)]);
        calmFrames.current = 0;
      }

      onMetrics?.(metrics);
      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationRef.current);
  }, [pictos, onMetrics]);

  const handlePointer = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    pointerRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  };

  const stopPointer = () => {
    pointerRef.current.active = false;
  };

  useEffect(() => {
    onSnapshotReady?.(canvasRef.current);
  }, [onSnapshotReady]);

  return (
    <div className="canvas-shell">
      <canvas
        ref={canvasRef}
        className="echo-canvas"
        onMouseMove={handlePointer}
        onMouseDown={handlePointer}
        onMouseUp={stopPointer}
        onMouseLeave={stopPointer}
      />
      <div className="attractor-legend">
        {attractors.map((a) => (
          <span key={a.id} style={{ color: a.color }}>
            {a.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function evolve(particles, width, height, pointer) {
  const damping = 0.985;
  const repulsion = 18;
  const pointerInfluence = 1200;

  particles.forEach((p, index) => {
    let fx = 0;
    let fy = 0;

    attractors.forEach((a) => {
      const ax = a.pos.x * width;
      const ay = a.pos.y * height;
      const dx = ax - p.x;
      const dy = ay - p.y;
      const dist = Math.hypot(dx, dy) + 0.001;
      const force = (a.strength * p.mass) / dist;
      fx += (dx / dist) * force;
      fy += (dy / dist) * force;
    });

    for (let j = index + 1; j < particles.length; j += 1) {
      const other = particles[j];
      const dx = p.x - other.x;
      const dy = p.y - other.y;
      const dist = Math.hypot(dx, dy) + 0.001;
      if (dist < 120) {
        const force = (repulsion * p.charge * other.charge) / (dist * dist);
        const fxRep = (dx / dist) * force;
        const fyRep = (dy / dist) * force;
        fx += fxRep;
        fy += fyRep;
        other.vx -= fxRep / other.mass;
        other.vy -= fyRep / other.mass;
      }
    }

    if (pointer.active) {
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const dist = Math.hypot(dx, dy) + 0.001;
      const blow = (pointerInfluence * p.mass) / (dist * dist + 40);
      fx += (dx / dist) * blow;
      fy += (dy / dist) * blow;
    }

    p.vx = (p.vx + fx) * damping;
    p.vy = (p.vy + fy) * damping;
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 20 || p.x > width - 20) p.vx *= -1;
    if (p.y < 20 || p.y > height - 20) p.vy *= -1;
    p.x = Math.min(width - 10, Math.max(10, p.x));
    p.y = Math.min(height - 10, Math.max(10, p.y));
  });

  const avgSpeed =
    particles.reduce((acc, p) => acc + Math.hypot(p.vx, p.vy), 0) / Math.max(1, particles.length);

  const density = Math.min(1, particles.length / 18);

  return { avgSpeed, density };
}

function renderBackdrop(ctx, width, height) {
  const gradient = ctx.createRadialGradient(width / 2, height / 2, 120, width / 2, height / 2, width);
  gradient.addColorStop(0, '#0c1020');
  gradient.addColorStop(1, '#05070d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 30; i += 1) {
    const x = (i * 73 + 41) % width;
    const y = (i * 131 + 97) % height;
    ctx.beginPath();
    ctx.arc(x, y, 0.6 + (i % 3) * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAttractors(ctx, width, height) {
  attractors.forEach((a) => {
    ctx.beginPath();
    ctx.fillStyle = `${a.color}50`;
    ctx.strokeStyle = `${a.color}80`;
    ctx.lineWidth = 2;
    ctx.arc(a.pos.x * width, a.pos.y * height, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

function drawParticles(ctx, particles) {
  particles.forEach((p) => {
    ctx.beginPath();
    ctx.fillStyle = `${p.color}d0`;
    ctx.strokeStyle = `${p.color}60`;
    ctx.lineWidth = 1.5;
    ctx.arc(p.x, p.y, 10 + p.weight * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#cfd8ef';
    ctx.font = '12px "Inter", system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(p.label, p.x, p.y - 14);
  });
}

function drawPictos(ctx, pictos) {
  pictos.forEach((picto) => {
    ctx.save();
    ctx.translate(picto.x, picto.y);
    ctx.rotate(picto.angle);
    ctx.strokeStyle = `${picto.color}aa`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(-picto.size / 2, -picto.size / 2, picto.size, picto.size);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = `${picto.inner}90`;
    ctx.arc(0, 0, picto.size / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function buildPicto(particles, width, height) {
  const center = particles.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 },
  );
  const cx = center.x / particles.length;
  const cy = center.y / particles.length;
  const palette = ['#f2b6b6', '#c1f0d5', '#7fb4ff', '#f4e9a3', '#d1c8ff'];
  return {
    x: cx + (Math.random() - 0.5) * 40,
    y: cy + (Math.random() - 0.5) * 40,
    angle: Math.random() * Math.PI,
    size: 34 + Math.random() * 22,
    color: palette[Math.floor(Math.random() * palette.length)],
    inner: palette[Math.floor(Math.random() * palette.length)],
    bounds: { width, height },
  };
}
