import { useEffect, useRef } from 'react';
import { mulberry32, clamp } from '../core/seeded.js';

export default function EchoCanvas({ state, onStateEvolve, onSnapshotReady }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const fieldRef = useRef([]);
  const liveStateRef = useRef(state);

  useEffect(() => {
    liveStateRef.current = state;
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !state) return;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const rand = mulberry32(state.seed);
    const count = Math.max(8, Math.floor(state.tags.length * 1.2));
    const particles = state.tags.slice(0, count).map((tag, index) => ({
      ...tag,
      x: (rand() * 0.6 + 0.2) * canvas.width,
      y: (rand() * 0.6 + 0.2) * canvas.height,
      vx: (rand() - 0.5) * (0.4 + state.flow),
      vy: (rand() - 0.5) * (0.4 + state.flow),
      life: 0,
      hueShift: rand() * 0.2 + index * 0.02,
    }));
    particlesRef.current = particles;
    fieldRef.current = buildFlowField(canvas.width, canvas.height, state.seed);
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      paintBackground(ctx, width, height, liveStateRef.current);
      renderField(ctx, fieldRef.current);

      const stats = evolveParticles(particlesRef.current, fieldRef.current, pointerRef.current, liveStateRef.current, width, height);
      renderParticles(ctx, particlesRef.current);

      if (pointerRef.current.active) {
        breathe(liveStateRef.current, onStateEvolve);
      }

      liveStateRef.current = { ...liveStateRef.current, flow: stats.flow, tension: stats.tension };
      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationRef.current);
  }, [onStateEvolve]);

  useEffect(() => {
    onSnapshotReady?.(canvasRef.current);
  }, [onSnapshotReady]);

  const handlePointer = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    pointerRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
  };

  const stopPointer = () => {
    pointerRef.current.active = false;
    dissipate(liveStateRef.current, onStateEvolve);
  };

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
        <span>Souffle = dispersion</span>
        <span>Contact = tension</span>
      </div>
    </div>
  );
}

function buildFlowField(width, height, seed) {
  const rand = mulberry32(seed * 17 + 13);
  const cols = 24;
  const rows = 14;
  const field = [];
  for (let x = 0; x < cols; x += 1) {
    for (let y = 0; y < rows; y += 1) {
      const angle = rand() * Math.PI * 2;
      const strength = 0.4 + rand() * 0.8;
      field.push({
        x: (x / cols) * width,
        y: (y / rows) * height,
        vx: Math.cos(angle) * strength,
        vy: Math.sin(angle) * strength,
      });
    }
  }
  return field;
}

function evolveParticles(particles, field, pointer, state, width, height) {
  const drift = 0.98;
  let speedSum = 0;

  particles.forEach((p) => {
    const vector = sampleField(field, p.x, p.y);
    p.vx = p.vx * drift + vector.vx * (0.4 + state.flow * 0.6);
    p.vy = p.vy * drift + vector.vy * (0.4 + state.flow * 0.6);

    if (pointer.active) {
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const dist = Math.hypot(dx, dy) + 0.001;
      const push = (state.tension + 0.2) * 140 / (dist + 30);
      p.vx += (dx / dist) * push;
      p.vy += (dy / dist) * push;
    }

    p.x += p.vx;
    p.y += p.vy;
    p.life += 1;

    if (p.x < 12 || p.x > width - 12) p.vx *= -1;
    if (p.y < 12 || p.y > height - 12) p.vy *= -1;
    p.x = clamp(p.x, 8, width - 8);
    p.y = clamp(p.y, 8, height - 8);

    speedSum += Math.hypot(p.vx, p.vy);
  });

  const avgSpeed = speedSum / Math.max(1, particles.length);
  const flow = clamp(avgSpeed / 8, 0, 1);
  const tension = clamp(pointer.active ? state.tension + 0.02 : state.tension * 0.995, 0, 1);

  return { flow, tension };
}

function sampleField(field, x, y) {
  if (!field.length) return { vx: 0, vy: 0 };
  let closest = field[0];
  let minDist = Infinity;
  field.forEach((node) => {
    const dx = node.x - x;
    const dy = node.y - y;
    const dist = dx * dx + dy * dy;
    if (dist < minDist) {
      minDist = dist;
      closest = node;
    }
  });
  return closest;
}

function paintBackground(ctx, width, height, state) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'rgba(8,12,24,0.95)');
  gradient.addColorStop(1, 'rgba(4,6,14,0.95)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = `rgba(255,255,255,${0.02 + state.entropy * 0.08})`;
  for (let i = 0; i < 36; i += 1) {
    const w = width * (0.25 + (i / 36) * 0.7);
    const h = height * (0.25 + (i / 36) * 0.7);
    ctx.strokeRect((width - w) / 2, (height - h) / 2, w, h);
  }
}

function renderField(ctx, field) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  field.forEach((node) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, 1.2, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();
}

function renderParticles(ctx, particles) {
  particles.forEach((p) => {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = `${p.color}d0`;
    ctx.strokeStyle = `${p.color}60`;
    ctx.lineWidth = 1.4;
    ctx.arc(p.x, p.y, 9 + p.mass * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = '12px "Inter", system-ui';
    ctx.fillStyle = '#d8e4ff';
    ctx.textAlign = 'center';
    ctx.fillText(p.label, p.x, p.y - 14);
    ctx.restore();
  });
}

function breathe(state, onStateEvolve) {
  const next = { ...state, flow: clamp(state.flow + 0.01, 0, 1), tension: clamp(state.tension + 0.006, 0, 1) };
  onStateEvolve?.(next);
}

function dissipate(state, onStateEvolve) {
  const next = { ...state, flow: clamp(state.flow * 0.95, 0, 1), tension: clamp(state.tension * 0.92, 0, 1) };
  onStateEvolve?.(next);
}
