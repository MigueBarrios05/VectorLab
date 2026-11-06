// avatars.js — Funciones de dibujo temático por entidad

export function drawAirplane(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-angle + Math.PI / 2);
  const s = 16;
  const g = ctx.createRadialGradient(0,0,4,0,0,s*1.8);
  g.addColorStop(0,'rgba(37,99,235,0.3)'); g.addColorStop(1,'rgba(37,99,235,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0,0,s*1.8,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#374151'; ctx.strokeStyle='#2563eb'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.ellipse(0,0,s*0.28,s,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s,s*0.1); ctx.lineTo(0,-s*0.1); ctx.lineTo(s,s*0.1); ctx.lineTo(0,s*0.2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s*0.45,s*0.75); ctx.lineTo(0,s*0.55); ctx.lineTo(s*0.45,s*0.75); ctx.lineTo(0,s*0.9); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

export function drawHiker(ctx, x, y, _angle) {
  ctx.save();
  ctx.translate(x, y);
  const s = 14;
  ctx.fillStyle='rgba(22,163,74,0.15)'; ctx.beginPath(); ctx.arc(0,0,s*1.6,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#16a34a'; ctx.lineWidth=2; ctx.lineCap='round';
  ctx.fillStyle='#fbbf24'; ctx.beginPath(); ctx.arc(0,-s*0.75,s*0.28,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,-s*0.45); ctx.lineTo(0,s*0.3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s*0.4,-s*0.1); ctx.lineTo(s*0.4,-s*0.1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,s*0.3); ctx.lineTo(-s*0.3,s*0.8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,s*0.3); ctx.lineTo(s*0.3,s*0.8); ctx.stroke();
  ctx.strokeStyle='#9ca3af'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(s*0.5,-s*0.3); ctx.lineTo(s*0.7,s*0.9); ctx.stroke();
  ctx.restore();
}

export function drawBird(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-angle);
  const s = 14;
  ctx.fillStyle='rgba(124,58,237,0.15)'; ctx.beginPath(); ctx.arc(0,0,s*1.6,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#6d28d9'; ctx.strokeStyle='#7c3aed'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.ellipse(0,0,s*0.5,s*0.28,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#f59e0b'; ctx.beginPath(); ctx.moveTo(s*0.5,0); ctx.lineTo(s*0.8,s*0.07); ctx.lineTo(s*0.5,s*0.1); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#7c3aed'; ctx.strokeStyle='#6d28d9';
  ctx.beginPath(); ctx.moveTo(0,-s*0.05); ctx.quadraticCurveTo(-s*0.5,-s*0.8,-s*1.1,-s*0.1); ctx.quadraticCurveTo(-s*0.5,-s*0.1,0,s*0.1); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,-s*0.05); ctx.quadraticCurveTo(s*0.3,-s*0.7,s*0.9,-s*0.1); ctx.quadraticCurveTo(s*0.4,-s*0.05,0,s*0.1); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(s*0.3,-s*0.05,s*0.07,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

export function drawWheel(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-angle);
  const s = 16;

  // Glow
  const g = ctx.createRadialGradient(0,0,4,0,0,s*1.8);
  g.addColorStop(0,'rgba(217,119,6,0.25)'); g.addColorStop(1,'rgba(217,119,6,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0,0,s*1.8,0,Math.PI*2); ctx.fill();

  // Outer tire
  ctx.strokeStyle = '#374151'; ctx.lineWidth = s * 0.28;
  ctx.beginPath(); ctx.arc(0,0,s*0.72,0,Math.PI*2); ctx.stroke();

  // Rim
  ctx.strokeStyle = '#d97706'; ctx.lineWidth = s * 0.12;
  ctx.beginPath(); ctx.arc(0,0,s*0.72,0,Math.PI*2); ctx.stroke();

  // Spokes x6
  ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI * 2) / 6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a)*s*0.18, Math.sin(a)*s*0.18);
    ctx.lineTo(Math.cos(a)*s*0.58, Math.sin(a)*s*0.58);
    ctx.stroke();
  }

  // Hub
  ctx.fillStyle = '#fbbf24'; ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0,0,s*0.18,0,Math.PI*2); ctx.fill(); ctx.stroke();

  // Direction marker (valve)
  ctx.fillStyle = '#dc2626';
  ctx.beginPath(); ctx.arc(s*0.62,0,s*0.1,0,Math.PI*2); ctx.fill();

  ctx.restore();
}

export const AVATAR_MAP = {
  airplane: drawAirplane,
  hiker:    drawHiker,
  bird:     drawBird,
  wheel:    drawWheel,
};
