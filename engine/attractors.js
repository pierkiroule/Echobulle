const EMOJIS = ['🔵', '🟣', '🟡'];

export function createAttractors() {
  const nodes = EMOJIS.map((emoji, index) => ({
    emoji,
    angle: Math.random() * Math.PI * 2,
    baseRadius: 70 + index * 16,
    phase: index * 1.2,
  }));

  function update(pulse, timestamp) {
    nodes.forEach((node, idx) => {
      const drift = 0.0003 + pulse * 0.0004;
      node.angle += drift;
      node.baseRadius = 70 + idx * 22 + Math.sin(timestamp * 0.001 + idx) * 8 * pulse;
    });
  }

  function positions(width, height, pulse) {
    const cx = width / 2;
    const cy = height / 2;
    return nodes.map((node, idx) => {
      const rx = node.baseRadius * (1.1 + 0.04 * idx);
      const ry = node.baseRadius * (0.7 + 0.05 * idx);
      const x = cx + Math.cos(node.angle + node.phase) * rx;
      const y = cy + Math.sin(node.angle * 1.05 + node.phase) * ry;
      const alpha = 0.6 + pulse * 0.25;
      return { ...node, x, y, alpha };
    });
  }

  function draw(ctx, width, height, pulse) {
    const list = positions(width, height, pulse);
    ctx.save();
    ctx.font = '28px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    list.forEach((node) => {
      ctx.globalAlpha = node.alpha;
      ctx.fillText(node.emoji, node.x, node.y);
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  return { update, draw, positions };
}

