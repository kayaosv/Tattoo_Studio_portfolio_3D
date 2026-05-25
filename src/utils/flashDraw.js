import { CATALOG, PAPERS } from '../data/catalog'

const W = 768
const H = 1152

function rng(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hexToRgba(hex, a) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return `rgba(${r},${g},${b},${a})`
}

function circle(ctx, x, y, r, fill, stroke) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
  if (fill) ctx.fill(); if (stroke) ctx.stroke()
}

function polygon(ctx, cx, cy, r, n, rot) {
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (rot || 0)
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
  }
  ctx.closePath(); ctx.stroke()
}

function drawPaper(ctx, w, h, paper) {
  const p = PAPERS[paper] || PAPERS.cream
  ctx.fillStyle = p.base
  ctx.fillRect(0, 0, w, h)
  const g = ctx.createRadialGradient(w * 0.5, h * 0.55, 0, w * 0.5, h * 0.55, Math.max(w, h) * 0.7)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, hexToRgba(p.shade, 0.55))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  const rand = rng(7)
  const spots = Math.floor(w * h / 900)
  ctx.fillStyle = hexToRgba(p.shade, 0.35)
  for (let i = 0; i < spots; i++) {
    const x = rand() * w, y = rand() * h, s = rand() * 1.6
    ctx.fillRect(x, y, s, s)
  }
  const r2 = ctx.createLinearGradient(0, 0, 0, h)
  r2.addColorStop(0, hexToRgba(p.shade, 0.35))
  r2.addColorStop(0.15, 'rgba(0,0,0,0)')
  r2.addColorStop(0.85, 'rgba(0,0,0,0)')
  r2.addColorStop(1, hexToRgba(p.shade, 0.45))
  ctx.fillStyle = r2
  ctx.fillRect(0, 0, w, h)
  return p
}

function drawFrame(ctx, w, h, p, accent, meta) {
  ctx.save()
  ctx.strokeStyle = hexToRgba(p.ink, 0.55)
  ctx.lineWidth = 1.5
  ctx.strokeRect(36, 36, w - 72, h - 72)
  ctx.strokeStyle = hexToRgba(p.ink, 0.18)
  ctx.lineWidth = 1
  ctx.strokeRect(48, 48, w - 96, h - 96)
  ctx.strokeStyle = hexToRgba(p.ink, 0.55)
  ctx.lineWidth = 1.5
  ;[[36, 36], [w - 36, 36], [36, h - 36], [w - 36, h - 36]].forEach(([x, y], i) => {
    ctx.beginPath()
    const dx = i % 2 ? -12 : 12
    const dy = i < 2 ? 12 : -12
    ctx.moveTo(x, y); ctx.lineTo(x + dx, y)
    ctx.moveTo(x, y); ctx.lineTo(x, y + dy)
    ctx.stroke()
  })
  ctx.fillStyle = hexToRgba(p.ink, 0.78)
  ctx.font = "500 16px 'JetBrains Mono', ui-monospace, monospace"
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillText('STUDIO TATTOO', 60, 60)
  ctx.fillStyle = accent
  ctx.save()
  ctx.translate(60 + 196, 70)
  ctx.rotate(Math.PI / 4)
  ctx.fillRect(-3, -3, 6, 6)
  ctx.restore()
  ctx.textAlign = 'right'
  ctx.fillStyle = hexToRgba(p.ink, 0.78)
  ctx.fillText(meta.indexLabel, w - 60, 60)
  ctx.textAlign = 'left'
  ctx.fillStyle = hexToRgba(p.ink, 0.78)
  ctx.fillText(meta.style.toUpperCase(), 60, h - 78)
  ctx.textAlign = 'right'
  ctx.fillStyle = hexToRgba(p.ink, 0.6)
  ctx.fillText(`${meta.artist} · ${meta.year}`, w - 60, h - 78)
  ctx.fillStyle = hexToRgba(p.ink, 0.9)
  ctx.font = "italic 300 30px 'Fraunces', 'Times New Roman', serif"
  ctx.textAlign = 'left'
  ctx.fillText(meta.title, 60, h - 110)
  ctx.restore()
}

function motifMandala(ctx, cx, cy, r, ink, accent) {
  ctx.save(); ctx.translate(cx, cy)
  ctx.strokeStyle = ink; ctx.lineWidth = 1.5
  circle(ctx, 0, 0, r, false, true)
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2
    const len = i % 5 === 0 ? 14 : 7
    ctx.beginPath()
    ctx.moveTo(Math.cos(a) * (r - 6), Math.sin(a) * (r - 6))
    ctx.lineTo(Math.cos(a) * (r - 6 - len), Math.sin(a) * (r - 6 - len))
    ctx.stroke()
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    ctx.save(); ctx.rotate(a)
    ctx.beginPath()
    ctx.moveTo(0, -r * 0.45)
    ctx.bezierCurveTo(r * 0.18, -r * 0.7, r * 0.18, -r * 0.9, 0, -r * 0.95)
    ctx.bezierCurveTo(-r * 0.18, -r * 0.9, -r * 0.18, -r * 0.7, 0, -r * 0.45)
    ctx.stroke(); ctx.restore()
  }
  circle(ctx, 0, 0, r * 0.45, false, true)
  circle(ctx, 0, 0, r * 0.28, false, true)
  ctx.fillStyle = ink
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2, rad = r * 0.36
    ctx.beginPath(); ctx.arc(Math.cos(a) * rad, Math.sin(a) * rad, 2.5, 0, Math.PI * 2); ctx.fill()
  }
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = ink
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(a) * r * 0.2, y = Math.sin(a) * r * 0.2
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
  }
  ctx.closePath(); ctx.stroke()
  ctx.restore()
}

function motifSerpent(ctx, cx, cy, r, ink, accent) {
  ctx.save(); ctx.translate(cx, cy)
  ctx.strokeStyle = ink; ctx.lineWidth = 2
  ctx.beginPath()
  const segs = 12, amp = r * 0.55, startY = -r * 0.95, endY = r * 0.95
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, y = startY + (endY - startY) * t
    const x = Math.sin(t * Math.PI * 3.2) * amp * (1 - Math.abs(t - 0.5))
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.lineWidth = 1
  for (let i = 1; i < segs; i++) {
    const t = i / segs, y = startY + (endY - startY) * t
    const x = Math.sin(t * Math.PI * 3.2) * amp * (1 - Math.abs(t - 0.5))
    const tang = Math.cos(t * Math.PI * 3.2) * amp * 0.3
    const nx = -tang, ny = (endY - startY) / segs
    const ln = Math.hypot(nx, ny), pnx = -ny / ln, pny = nx / ln
    for (const d of [-6, 6]) {
      ctx.beginPath(); ctx.arc(x + pnx * d * 0.6, y + pny * d * 0.6, 3, 0, Math.PI * 2); ctx.stroke()
    }
  }
  const hx = 0, hy = startY
  ctx.beginPath()
  ctx.moveTo(hx, hy); ctx.lineTo(hx - 18, hy - 12); ctx.lineTo(hx, hy - 30); ctx.lineTo(hx + 18, hy - 12)
  ctx.closePath(); ctx.fillStyle = ink; ctx.fill()
  ctx.strokeStyle = accent; ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(hx, hy - 30); ctx.lineTo(hx, hy - 50)
  ctx.moveTo(hx, hy - 50); ctx.lineTo(hx - 6, hy - 58)
  ctx.moveTo(hx, hy - 50); ctx.lineTo(hx + 6, hy - 58)
  ctx.stroke()
  ctx.strokeStyle = ink; ctx.lineWidth = 1
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98)
    ctx.lineTo(Math.cos(a) * r * 1.08, Math.sin(a) * r * 1.08)
    ctx.stroke()
  }
  ctx.restore()
}

function motifBotanical(ctx, cx, cy, r, ink, accent) {
  ctx.save(); ctx.translate(cx, cy)
  ctx.strokeStyle = ink; ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(0, r * 0.95); ctx.bezierCurveTo(-r * 0.1, r * 0.4, r * 0.1, -r * 0.2, 0, -r * 0.6); ctx.stroke()
  const leafPoints = [[0.7, -0.2, 1], [0.5, 0.2, -1], [0.25, 0.5, 1], [0.05, 0.7, -1], [-0.15, 0.85, 1]]
  for (const [yt, xoff, side] of leafPoints) {
    const y = r * yt, x = xoff * r, sz = r * (0.15 + Math.abs(yt) * 0.06)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.bezierCurveTo(side * sz * 0.4, y - sz * 0.5, side * sz * 0.9, y - sz * 0.2, side * sz, y)
    ctx.bezierCurveTo(side * sz * 0.9, y + sz * 0.3, side * sz * 0.4, y + sz * 0.4, 0, y)
    ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(side * sz * 0.85, y); ctx.stroke()
  }
  ctx.lineWidth = 1.3
  const fx = 0, fy = -r * 0.7
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(a)
    ctx.beginPath()
    ctx.moveTo(0, 0); ctx.bezierCurveTo(8, -10, 12, -22, 0, -28); ctx.bezierCurveTo(-12, -22, -8, -10, 0, 0)
    ctx.stroke(); ctx.restore()
  }
  ctx.fillStyle = ink
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2
    ctx.beginPath(); ctx.arc(fx + Math.cos(a) * 4, fy + Math.sin(a) * 4, 1.6, 0, Math.PI * 2); ctx.fill()
  }
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(fx, fy, 3.5, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function motifGeometric(ctx, cx, cy, r, ink, accent) {
  ctx.save(); ctx.translate(cx, cy)
  ctx.strokeStyle = ink; ctx.lineWidth = 1.5
  polygon(ctx, 0, 0, r, 3, -Math.PI / 2)
  polygon(ctx, 0, 0, r * 0.62, 3, Math.PI / 2)
  circle(ctx, 0, 0, r * 0.32, false, true)
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2, r0 = r * 1.05, r1 = r * (i % 2 ? 1.18 : 1.12)
    ctx.beginPath()
    ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.stroke()
  }
  ctx.beginPath()
  ctx.moveTo(-r * 0.18, 0)
  ctx.bezierCurveTo(-r * 0.08, -r * 0.18, r * 0.08, -r * 0.18, r * 0.18, 0)
  ctx.bezierCurveTo(r * 0.08, r * 0.18, -r * 0.08, r * 0.18, -r * 0.18, 0)
  ctx.stroke()
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill()
  ;[[-r * 0.85, -r * 0.85], [r * 0.85, -r * 0.85], [-r * 0.85, r * 0.85], [r * 0.85, r * 0.85]].forEach(([x, y]) => {
    ctx.beginPath()
    ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); ctx.stroke()
  })
  ctx.restore()
}

function motifDagger(ctx, cx, cy, r, ink, accent) {
  ctx.save(); ctx.translate(cx, cy)
  ctx.strokeStyle = ink; ctx.lineWidth = 2
  circle(ctx, 0, -r * 0.85, 12, false, true)
  circle(ctx, 0, -r * 0.85, 5, true, false)
  ctx.beginPath()
  ctx.moveTo(-6, -r * 0.78); ctx.lineTo(-6, -r * 0.45); ctx.lineTo(6, -r * 0.45); ctx.lineTo(6, -r * 0.78); ctx.closePath(); ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-r * 0.35, -r * 0.42); ctx.lineTo(r * 0.35, -r * 0.42); ctx.lineTo(r * 0.32, -r * 0.36); ctx.lineTo(-r * 0.32, -r * 0.36); ctx.closePath(); ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-r * 0.13, -r * 0.34); ctx.lineTo(r * 0.13, -r * 0.34); ctx.lineTo(0, r * 0.95); ctx.closePath(); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, -r * 0.34); ctx.lineTo(0, r * 0.92); ctx.stroke()
  ctx.fillStyle = accent
  ctx.beginPath()
  ctx.moveTo(0, -r * 0.395 - 5); ctx.lineTo(5, -r * 0.395); ctx.lineTo(0, -r * 0.395 + 5); ctx.lineTo(-5, -r * 0.395); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = ink; ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(-r * 0.85, r * 0.45); ctx.bezierCurveTo(-r * 0.45, r * 0.25, r * 0.45, r * 0.25, r * 0.85, r * 0.45)
  ctx.bezierCurveTo(r * 0.45, r * 0.4, -r * 0.45, r * 0.4, -r * 0.85, r * 0.45); ctx.closePath(); ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-r * 0.78, r * 0.43); ctx.lineTo(-r * 0.92, r * 0.55); ctx.lineTo(-r * 0.7, r * 0.5)
  ctx.moveTo(r * 0.78, r * 0.43); ctx.lineTo(r * 0.92, r * 0.55); ctx.lineTo(r * 0.7, r * 0.5); ctx.stroke()
  ctx.restore()
}

function motifMoth(ctx, cx, cy, r, ink, accent) {
  ctx.save(); ctx.translate(cx, cy)
  ctx.strokeStyle = ink; ctx.lineWidth = 1.4
  ctx.beginPath(); ctx.ellipse(0, 0, 10, r * 0.6, 0, 0, Math.PI * 2); ctx.stroke()
  for (let i = -4; i <= 4; i++) {
    const y = i * (r * 0.12); ctx.beginPath(); ctx.moveTo(-9, y); ctx.lineTo(9, y); ctx.stroke()
  }
  for (const s of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(0, -r * 0.45)
    ctx.bezierCurveTo(s * r * 0.5, -r * 0.85, s * r * 0.95, -r * 0.5, s * r * 0.78, -r * 0.05)
    ctx.bezierCurveTo(s * r * 0.55, -r * 0.05, s * r * 0.15, -r * 0.15, 0, -r * 0.05)
    ctx.closePath(); ctx.stroke()
  }
  for (const s of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.bezierCurveTo(s * r * 0.55, r * 0.1, s * r * 0.85, r * 0.45, s * r * 0.55, r * 0.7)
    ctx.bezierCurveTo(s * r * 0.3, r * 0.55, s * r * 0.1, r * 0.45, 0, r * 0.3)
    ctx.closePath(); ctx.stroke()
  }
  for (const s of [-1, 1]) {
    circle(ctx, s * r * 0.5, -r * 0.35, r * 0.1, false, true)
    circle(ctx, s * r * 0.5, -r * 0.35, r * 0.04, true, false)
  }
  ctx.beginPath()
  ctx.moveTo(-3, -r * 0.6); ctx.bezierCurveTo(-r * 0.2, -r * 0.85, -r * 0.18, -r * 0.95, -r * 0.05, -r * 0.95)
  ctx.moveTo(3, -r * 0.6); ctx.bezierCurveTo(r * 0.2, -r * 0.85, r * 0.18, -r * 0.95, r * 0.05, -r * 0.95)
  ctx.stroke()
  ctx.strokeStyle = accent; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(0, -r * 0.78, 9, 0, Math.PI, true); ctx.stroke()
  ctx.restore()
}

function motifHand(ctx, cx, cy, r, ink, accent) {
  ctx.save(); ctx.translate(cx, cy + r * 0.05)
  ctx.strokeStyle = ink; ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.moveTo(-r * 0.55, r * 0.6); ctx.lineTo(-r * 0.55, -r * 0.05)
  ctx.bezierCurveTo(-r * 0.55, -r * 0.2, -r * 0.42, -r * 0.25, -r * 0.4, -r * 0.5)
  ctx.lineTo(-r * 0.4, -r * 0.78)
  ctx.bezierCurveTo(-r * 0.4, -r * 0.86, -r * 0.18, -r * 0.86, -r * 0.18, -r * 0.78)
  ctx.lineTo(-r * 0.18, -r * 0.6); ctx.lineTo(-r * 0.18, -r * 0.88)
  ctx.bezierCurveTo(-r * 0.18, -r * 0.96, r * 0.02, -r * 0.96, r * 0.02, -r * 0.88)
  ctx.lineTo(r * 0.02, -r * 0.6); ctx.lineTo(r * 0.02, -r * 0.92)
  ctx.bezierCurveTo(r * 0.02, -r * 1.0, r * 0.22, -r * 1.0, r * 0.22, -r * 0.92)
  ctx.lineTo(r * 0.22, -r * 0.55); ctx.lineTo(r * 0.22, -r * 0.82)
  ctx.bezierCurveTo(r * 0.22, -r * 0.9, r * 0.42, -r * 0.9, r * 0.42, -r * 0.82)
  ctx.lineTo(r * 0.42, -r * 0.3); ctx.lineTo(r * 0.55, -r * 0.05); ctx.lineTo(r * 0.55, r * 0.6)
  ctx.closePath(); ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(r * 0.42, -r * 0.3); ctx.bezierCurveTo(r * 0.65, -r * 0.2, r * 0.75, r * 0.05, r * 0.68, r * 0.2); ctx.stroke()
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(-r * 0.3, r * 0.05); ctx.bezierCurveTo(-r * 0.05, r * 0.0, r * 0.2, r * 0.05, r * 0.35, r * 0.18)
  ctx.moveTo(-r * 0.4, r * 0.2); ctx.bezierCurveTo(-r * 0.1, r * 0.15, r * 0.18, r * 0.22, r * 0.3, r * 0.35)
  ctx.moveTo(-r * 0.4, r * 0.35); ctx.bezierCurveTo(-r * 0.15, r * 0.5, r * 0.05, r * 0.55, r * 0.2, r * 0.55)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-r * 0.18, -r * 0.05)
  ctx.bezierCurveTo(-r * 0.08, -r * 0.18, r * 0.08, -r * 0.18, r * 0.18, -r * 0.05)
  ctx.bezierCurveTo(r * 0.08, r * 0.08, -r * 0.08, r * 0.08, -r * 0.18, -r * 0.05)
  ctx.stroke()
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(0, -r * 0.06, 5, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(0, -r * 0.06, 2, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function motifWave(ctx, cx, cy, r, ink, accent) {
  ctx.save(); ctx.translate(cx, cy)
  ctx.strokeStyle = ink; ctx.lineWidth = 1.8
  ctx.beginPath()
  ctx.moveTo(-r * 0.95, r * 0.4)
  ctx.bezierCurveTo(-r * 0.5, r * 0.4, -r * 0.7, -r * 0.5, -r * 0.2, -r * 0.5)
  ctx.bezierCurveTo(r * 0.15, -r * 0.5, r * 0.0, -r * 0.05, r * 0.25, -r * 0.05)
  ctx.bezierCurveTo(r * 0.45, -r * 0.05, r * 0.55, -r * 0.5, r * 0.85, -r * 0.45)
  ctx.stroke()
  ctx.lineWidth = 1.4
  ;[[-r * 0.55, -r * 0.42, 14], [-r * 0.3, -r * 0.5, 11], [0.0, -r * 0.45, 10], [r * 0.3, -r * 0.4, 12], [r * 0.6, -r * 0.5, 13]].forEach(([x, y, rad]) => {
    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 1.7); ctx.stroke()
  })
  ctx.fillStyle = ink
  ;[[-r * 0.78, -r * 0.7], [-r * 0.4, -r * 0.78], [r * 0.1, -r * 0.85], [r * 0.5, -r * 0.78], [r * 0.85, -r * 0.7]].forEach(([x, y]) => {
    ctx.beginPath(); ctx.ellipse(x, y, 2.5, 5, 0, 0, Math.PI * 2); ctx.fill()
  })
  ctx.strokeStyle = ink
  circle(ctx, r * 0.55, -r * 0.85, 12, false, true)
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(r * 0.55 + Math.cos(a) * 16, -r * 0.85 + Math.sin(a) * 16)
    ctx.lineTo(r * 0.55 + Math.cos(a) * 22, -r * 0.85 + Math.sin(a) * 22); ctx.stroke()
  }
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.lineWidth = 1
    const y = r * (0.55 + i * 0.13)
    ctx.moveTo(-r * 0.95, y)
    for (let x = -r * 0.95; x <= r * 0.95; x += 18) ctx.lineTo(x, y + Math.sin(x * 0.04 + i) * 4)
    ctx.stroke()
  }
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(r * 0.55, r * 0.55, 4, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function drawMoonPhase(ctx, x, y, r, phase, ink) {
  ctx.save(); ctx.translate(x, y)
  ctx.strokeStyle = ink; ctx.lineWidth = 1.2
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke()
  ctx.fillStyle = ink
  if (phase === 0 || phase === 1) {
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill()
  } else if (phase !== 0.5) {
    ctx.beginPath()
    if (phase < 0.5) {
      ctx.arc(0, 0, r, Math.PI * 0.5, Math.PI * 1.5)
      ctx.bezierCurveTo(r * (1 - phase * 4) * 0.5, r * 0.55, r * (1 - phase * 4) * 0.5, -r * 0.55, 0, -r)
    } else {
      const p = (phase - 0.5) * 2
      ctx.arc(0, 0, r, Math.PI * 1.5, Math.PI * 0.5)
      ctx.bezierCurveTo(-r * (1 - p) * 0.5, -r * 0.55, -r * (1 - p) * 0.5, r * 0.55, 0, r)
    }
    ctx.closePath(); ctx.fill()
  }
  ctx.restore()
}

function motifMoonPhases(ctx, cx, cy, r, ink, accent) {
  ctx.save(); ctx.translate(cx, cy)
  ctx.strokeStyle = ink; ctx.lineWidth = 1.4
  ctx.beginPath(); ctx.arc(0, r * 0.8, r * 0.95, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke()
  const phases = [0, 0.25, 0.5, 0.75, 1]
  for (let i = 0; i < 5; i++) {
    const t = i / 4, ang = Math.PI * 1.15 + (Math.PI * 0.7) * t
    drawMoonPhase(ctx, Math.cos(ang) * r * 0.95, r * 0.8 + Math.sin(ang) * r * 0.95, 22, phases[i], ink)
  }
  ctx.strokeStyle = ink
  circle(ctx, 0, -r * 0.55, r * 0.25, false, true)
  circle(ctx, 0, -r * 0.55, r * 0.12, false, true)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(Math.cos(a) * r * 0.3, -r * 0.55 + Math.sin(a) * r * 0.3)
    ctx.lineTo(Math.cos(a) * r * 0.4, -r * 0.55 + Math.sin(a) * r * 0.4); ctx.stroke()
  }
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(0, -r * 0.55, 4, 0, Math.PI * 2); ctx.fill()
  const rand2 = rng(11)
  ctx.strokeStyle = ink
  for (let i = 0; i < 14; i++) {
    const x = (rand2() - 0.5) * r * 1.8, y = (rand2() - 0.5) * r * 1.4 - r * 0.1
    if (Math.hypot(x, y + r * 0.55) < r * 0.45) continue
    if (Math.hypot(x, y - r * 0.8) < r) continue
    ctx.beginPath()
    ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke()
  }
  ctx.restore()
}

function motifScript(ctx, cx, cy, r, ink, accent) {
  ctx.save(); ctx.translate(cx, cy)
  ctx.strokeStyle = ink; ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(-r * 0.6, -r * 0.5); ctx.bezierCurveTo(-r * 0.3, -r * 0.7, r * 0.3, -r * 0.7, r * 0.6, -r * 0.5)
  ctx.bezierCurveTo(r * 0.3, -r * 0.3, -r * 0.3, -r * 0.3, -r * 0.6, -r * 0.5); ctx.stroke()
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(0, -r * 0.5, 5, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(0, -r * 0.5, 2.2, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.font = `italic 300 ${Math.floor(r * 0.55)}px 'Fraunces', 'Times New Roman', serif`
  ctx.fillText('memento', 0, 0)
  ctx.font = `italic 300 ${Math.floor(r * 0.4)}px 'Fraunces', 'Times New Roman', serif`
  ctx.fillText('mori', 0, r * 0.32)
  ctx.strokeStyle = ink; ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(-r * 0.5, r * 0.55); ctx.bezierCurveTo(-r * 0.25, r * 0.7, r * 0.25, r * 0.4, r * 0.5, r * 0.55); ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-r * 0.55, r * 0.55); ctx.lineTo(-r * 0.65, r * 0.55)
  ctx.moveTo(r * 0.55, r * 0.55); ctx.lineTo(r * 0.65, r * 0.55); ctx.stroke()
  for (const x of [-r * 0.4, 0, r * 0.4]) {
    const y = r * 0.85
    ctx.beginPath()
    ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5); ctx.stroke()
  }
  ctx.restore()
}

function motifSkull(ctx, cx, cy, r, ink, accent) {
  ctx.save(); ctx.translate(cx, cy)
  ctx.strokeStyle = ink; ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.moveTo(-r * 0.55, 0); ctx.bezierCurveTo(-r * 0.55, -r * 0.7, r * 0.55, -r * 0.7, r * 0.55, 0)
  ctx.lineTo(r * 0.45, r * 0.1); ctx.lineTo(r * 0.4, r * 0.3); ctx.lineTo(r * 0.25, r * 0.35)
  ctx.lineTo(r * 0.18, r * 0.55); ctx.lineTo(-r * 0.18, r * 0.55); ctx.lineTo(-r * 0.25, r * 0.35)
  ctx.lineTo(-r * 0.4, r * 0.3); ctx.lineTo(-r * 0.45, r * 0.1); ctx.closePath(); ctx.stroke()
  ctx.fillStyle = ink
  ctx.beginPath(); ctx.ellipse(-r * 0.22, -r * 0.18, r * 0.13, r * 0.16, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(r * 0.22, -r * 0.18, r * 0.13, r * 0.16, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.moveTo(0, -r * 0.05); ctx.lineTo(-r * 0.06, r * 0.12); ctx.lineTo(r * 0.06, r * 0.12); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = ink; ctx.lineWidth = 1.2
  ctx.beginPath(); ctx.moveTo(-r * 0.22, r * 0.35); ctx.lineTo(r * 0.22, r * 0.35)
  for (let i = -3; i <= 3; i++) {
    const x = i * (r * 0.06); ctx.moveTo(x, r * 0.35); ctx.lineTo(x, r * 0.5)
  }
  ctx.stroke()
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const t = i / 4, ax = side * (r * 0.35 + t * r * 0.4), ay = -r * 0.78 + t * t * r * 0.2
      ctx.beginPath(); ctx.ellipse(ax, ay, 8, 4, side * Math.PI * (0.2 - t * 0.4), 0, Math.PI * 2); ctx.stroke()
    }
  }
  ctx.fillStyle = accent
  ctx.beginPath()
  ctx.moveTo(0, -r * 0.6 - 6); ctx.lineTo(6, -r * 0.6); ctx.lineTo(0, -r * 0.6 + 6); ctx.lineTo(-6, -r * 0.6); ctx.closePath(); ctx.fill()
  ctx.restore()
}

function motifRoseCompass(ctx, cx, cy, r, ink, accent) {
  ctx.save(); ctx.translate(cx, cy)
  ctx.strokeStyle = ink; ctx.lineWidth = 1.5
  circle(ctx, 0, 0, r, false, true); circle(ctx, 0, 0, r * 0.95, false, true)
  ctx.lineWidth = 1
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2, len = i % 9 === 0 ? 18 : 8
    ctx.beginPath()
    ctx.moveTo(Math.cos(a) * (r * 0.95), Math.sin(a) * (r * 0.95))
    ctx.lineTo(Math.cos(a) * (r * 0.95 - len), Math.sin(a) * (r * 0.95 - len)); ctx.stroke()
  }
  ctx.lineWidth = 1.5
  ctx.beginPath()
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 - Math.PI / 2
    const tip = r * 0.7, base = r * 0.18
    const x0 = Math.cos(a) * tip, y0 = Math.sin(a) * tip
    const a1 = a + Math.PI / 2, a2 = a - Math.PI / 2
    ctx.moveTo(x0, y0); ctx.lineTo(Math.cos(a1) * base * 0.4, Math.sin(a1) * base * 0.4)
    ctx.lineTo(Math.cos(a2) * base * 0.4, Math.sin(a2) * base * 0.4); ctx.closePath()
  }
  ctx.stroke()
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 - Math.PI / 4
    const tip = r * 0.45, base = r * 0.1
    const x0 = Math.cos(a) * tip, y0 = Math.sin(a) * tip
    const a1 = a + Math.PI / 2, a2 = a - Math.PI / 2
    ctx.beginPath()
    ctx.moveTo(x0, y0); ctx.lineTo(Math.cos(a1) * base * 0.4, Math.sin(a1) * base * 0.4)
    ctx.lineTo(Math.cos(a2) * base * 0.4, Math.sin(a2) * base * 0.4); ctx.closePath(); ctx.stroke()
  }
  circle(ctx, 0, 0, r * 0.1, false, true)
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(0, 0, r * 0.05, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = ink; ctx.font = "500 18px 'JetBrains Mono', monospace"
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('N', 0, -r * 0.75)
  ctx.restore()
}

const MOTIF_FNS = {
  mandala: motifMandala,
  serpent: motifSerpent,
  botanical: motifBotanical,
  geometric: motifGeometric,
  dagger: motifDagger,
  moth: motifMoth,
  hand: motifHand,
  wave: motifWave,
  moon: motifMoonPhases,
  script: motifScript,
  skull: motifSkull,
  compass: motifRoseCompass,
}

export function buildFlashCanvas({ index, total, paper = 'cream', accent = '#e94560' }) {
  const item = CATALOG[index % CATALOG.length]
  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const ctx = cv.getContext('2d')
  const p = drawPaper(ctx, W, H, paper)
  const meta = {
    indexLabel: `N° ${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`,
    title: item.title,
    style: item.style,
    artist: item.artist,
    year: item.year,
  }
  const cx = W / 2, cy = H / 2 - 30, r = Math.min(W, H) * 0.32
  const fn = MOTIF_FNS[item.motif] || motifMandala
  fn(ctx, cx, cy, r, p.ink, accent)
  drawFrame(ctx, W, H, p, accent, meta)
  return { canvas: cv, item }
}
