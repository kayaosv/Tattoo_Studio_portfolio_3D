/* ============================================================
   Sinextesia — Procedural Tattoo Flash Generator
   ------------------------------------------------------------
   Builds canvas textures that read as real tattoo flash: cream
   paper, black ink, the occasional accent hairline. Each design
   has a fixed seed so the layout is stable across reloads.

   Exports: window.SX_FLASH = { build(opts), CATALOG }
   ============================================================ */
(function () {
  "use strict";

  const W = 768;   // texture width (portrait card 2:3)
  const H = 1152;

  /* ---------- deterministic RNG (mulberry32) ---------------- */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- paper grounds ---------------------------------- */
  const PAPERS = {
    cream: { base: "#ecead8", shade: "#d8d4b8", ink: "#0c0c0d", sub: "#5a5a52" },
    ash:   { base: "#1f1f23", shade: "#0f0f12", ink: "#f1efe4", sub: "#9a9aa3" },
    ink:   { base: "#0a0a0c", shade: "#000000", ink: "#f1efe4", sub: "#7c7c84" }
  };

  function drawPaper(ctx, w, h, paper) {
    const p = PAPERS[paper] || PAPERS.cream;
    // base fill
    ctx.fillStyle = p.base;
    ctx.fillRect(0, 0, w, h);
    // vignette
    const g = ctx.createRadialGradient(w * 0.5, h * 0.55, 0, w * 0.5, h * 0.55, Math.max(w, h) * 0.7);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, hexToRgba(p.shade, 0.55));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // paper grain — sparse speckle so it reads at 1:1 but disappears at distance
    const r = rng(7);
    const spots = Math.floor(w * h / 900);
    ctx.fillStyle = hexToRgba(p.shade, 0.35);
    for (let i = 0; i < spots; i++) {
      const x = r() * w, y = r() * h, s = r() * 1.6;
      ctx.fillRect(x, y, s, s);
    }
    // top/bottom darker rim
    const r2 = ctx.createLinearGradient(0, 0, 0, h);
    r2.addColorStop(0, hexToRgba(p.shade, 0.35));
    r2.addColorStop(0.15, "rgba(0,0,0,0)");
    r2.addColorStop(0.85, "rgba(0,0,0,0)");
    r2.addColorStop(1, hexToRgba(p.shade, 0.45));
    ctx.fillStyle = r2;
    ctx.fillRect(0, 0, w, h);
    return p;
  }

  function hexToRgba(hex, a) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r},${g},${b},${a})`;
  }

  /* ---------- shared frame chrome --------------------------- */
  function drawFrame(ctx, w, h, p, accent, meta) {
    ctx.save();
    // hairline frame
    ctx.strokeStyle = hexToRgba(p.ink, 0.55);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(36, 36, w - 72, h - 72);
    ctx.strokeStyle = hexToRgba(p.ink, 0.18);
    ctx.lineWidth = 1;
    ctx.strokeRect(48, 48, w - 96, h - 96);

    // corner ticks
    ctx.strokeStyle = hexToRgba(p.ink, 0.55);
    ctx.lineWidth = 1.5;
    [[36, 36], [w - 36, 36], [36, h - 36], [w - 36, h - 36]].forEach(([x, y], i) => {
      ctx.beginPath();
      const dx = i % 2 ? -12 : 12;
      const dy = i < 2 ? 12 : -12;
      ctx.moveTo(x, y); ctx.lineTo(x + dx, y);
      ctx.moveTo(x, y); ctx.lineTo(x, y + dy);
      ctx.stroke();
    });

    // top — studio mark
    ctx.fillStyle = hexToRgba(p.ink, 0.78);
    ctx.font = "500 16px 'JetBrains Mono', ui-monospace, monospace";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillText("SINÉSTESIA", 60, 60);

    // accent diamond
    ctx.fillStyle = accent;
    ctx.save();
    ctx.translate(60 + 144, 70);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();

    // top right index
    ctx.textAlign = "right";
    ctx.fillStyle = hexToRgba(p.ink, 0.78);
    ctx.fillText(meta.indexLabel, w - 60, 60);

    // bottom: style label
    ctx.textAlign = "left";
    ctx.fillStyle = hexToRgba(p.ink, 0.78);
    ctx.fillText(meta.style.toUpperCase(), 60, h - 78);

    // bottom right: year + artist
    ctx.textAlign = "right";
    ctx.fillStyle = hexToRgba(p.ink, 0.6);
    ctx.fillText(`${meta.artist} · ${meta.year}`, w - 60, h - 78);

    // title — serif italic, mid-bottom
    ctx.fillStyle = hexToRgba(p.ink, 0.9);
    ctx.font = "italic 300 30px 'Fraunces', 'Times New Roman', serif";
    ctx.textAlign = "left";
    ctx.fillText(meta.title, 60, h - 110);

    ctx.restore();
  }

  /* =========================================================
     INK MOTIFS — each draws a centered design in box (cx, cy, r)
     All use the foreground color `ink`. Accent is used sparingly.
     ========================================================= */

  function motifMandala(ctx, cx, cy, r, ink, accent) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = ink; ctx.lineWidth = 1.5;
    // outer ring
    circle(ctx, 0, 0, r, false, true);
    // tick ring
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const len = i % 5 === 0 ? 14 : 7;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r - 6), Math.sin(a) * (r - 6));
      ctx.lineTo(Math.cos(a) * (r - 6 - len), Math.sin(a) * (r - 6 - len));
      ctx.stroke();
    }
    // petal layer
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.45);
      ctx.bezierCurveTo(r * 0.18, -r * 0.7, r * 0.18, -r * 0.9, 0, -r * 0.95);
      ctx.bezierCurveTo(-r * 0.18, -r * 0.9, -r * 0.18, -r * 0.7, 0, -r * 0.45);
      ctx.stroke();
      ctx.restore();
    }
    // inner circles
    circle(ctx, 0, 0, r * 0.45, false, true);
    circle(ctx, 0, 0, r * 0.28, false, true);
    // dot ring
    ctx.fillStyle = ink;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const rad = r * 0.36;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * rad, Math.sin(a) * rad, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // center accent
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
    // inner star
    ctx.strokeStyle = ink;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r * 0.2, y = Math.sin(a) * r * 0.2;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.stroke();
    ctx.restore();
  }

  function motifSerpent(ctx, cx, cy, r, ink, accent) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = ink; ctx.lineWidth = 2;

    // sinuous body
    ctx.beginPath();
    const segs = 12, amp = r * 0.55;
    const startY = -r * 0.95, endY = r * 0.95;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const y = startY + (endY - startY) * t;
      const x = Math.sin(t * Math.PI * 3.2) * amp * (1 - Math.abs(t - 0.5));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // scales along body
    ctx.lineWidth = 1;
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      const y = startY + (endY - startY) * t;
      const x = Math.sin(t * Math.PI * 3.2) * amp * (1 - Math.abs(t - 0.5));
      const tang = Math.cos(t * Math.PI * 3.2) * amp * 0.3;
      const nx = -tang, ny = (endY - startY) / segs;
      const ln = Math.hypot(nx, ny);
      const pnx = -ny / ln, pny = nx / ln;
      for (const d of [-6, 6]) {
        ctx.beginPath();
        ctx.arc(x + pnx * d * 0.6, y + pny * d * 0.6, 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // head — diamond shape at top
    const hx = Math.sin(0 * Math.PI * 3.2) * 0, hy = startY;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx - 18, hy - 12);
    ctx.lineTo(hx, hy - 30);
    ctx.lineTo(hx + 18, hy - 12);
    ctx.closePath();
    ctx.fillStyle = ink; ctx.fill();
    // forked tongue
    ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(hx, hy - 30);
    ctx.lineTo(hx, hy - 50);
    ctx.moveTo(hx, hy - 50);
    ctx.lineTo(hx - 6, hy - 58);
    ctx.moveTo(hx, hy - 50);
    ctx.lineTo(hx + 6, hy - 58);
    ctx.stroke();

    // small encircling sun rays
    ctx.strokeStyle = ink; ctx.lineWidth = 1;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98);
      ctx.lineTo(Math.cos(a) * r * 1.08, Math.sin(a) * r * 1.08);
      ctx.stroke();
    }
    ctx.restore();
  }

  function motifBotanical(ctx, cx, cy, r, ink, accent) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = ink; ctx.lineWidth = 1.4;
    // stem
    ctx.beginPath();
    ctx.moveTo(0, r * 0.95);
    ctx.bezierCurveTo(-r * 0.1, r * 0.4, r * 0.1, -r * 0.2, 0, -r * 0.6);
    ctx.stroke();
    // leaves along stem
    const leafPoints = [
      [0.7, -0.2, 1], [0.5, 0.2, -1], [0.25, 0.5, 1], [0.05, 0.7, -1], [-0.15, 0.85, 1]
    ];
    for (const [yt, xoff, side] of leafPoints) {
      const y = r * yt;
      const x = xoff * r;
      const sz = r * (0.15 + Math.abs(yt) * 0.06);
      ctx.beginPath();
      // leaf shape
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(side * sz * 0.4, y - sz * 0.5, side * sz * 0.9, y - sz * 0.2, side * sz, y);
      ctx.bezierCurveTo(side * sz * 0.9, y + sz * 0.3, side * sz * 0.4, y + sz * 0.4, 0, y);
      ctx.stroke();
      // vein
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(side * sz * 0.85, y);
      ctx.stroke();
    }
    // flower at top — many petals
    ctx.strokeStyle = ink; ctx.lineWidth = 1.3;
    const fx = 0, fy = -r * 0.7;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.save();
      ctx.translate(fx, fy); ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(8, -10, 12, -22, 0, -28);
      ctx.bezierCurveTo(-12, -22, -8, -10, 0, 0);
      ctx.stroke();
      ctx.restore();
    }
    // stamen dots
    ctx.fillStyle = ink;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(fx + Math.cos(a) * 4, fy + Math.sin(a) * 4, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    // center accent
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(fx, fy, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function motifGeometric(ctx, cx, cy, r, ink, accent) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = ink; ctx.lineWidth = 1.5;
    // outer triangle
    polygon(ctx, 0, 0, r, 3, -Math.PI / 2);
    // inner inverted triangle
    polygon(ctx, 0, 0, r * 0.62, 3, Math.PI / 2);
    // center circle
    circle(ctx, 0, 0, r * 0.32, false, true);
    // sun rays around
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r0 = r * 1.05, r1 = r * (i % 2 ? 1.18 : 1.12);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.stroke();
    }
    // eye / vesica
    ctx.beginPath();
    ctx.moveTo(-r * 0.18, 0);
    ctx.bezierCurveTo(-r * 0.08, -r * 0.18, r * 0.08, -r * 0.18, r * 0.18, 0);
    ctx.bezierCurveTo(r * 0.08, r * 0.18, -r * 0.08, r * 0.18, -r * 0.18, 0);
    ctx.stroke();
    // pupil accent
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ink;
    ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
    // tiny stars in corners
    ctx.strokeStyle = ink;
    [[-r * 0.85, -r * 0.85], [r * 0.85, -r * 0.85], [-r * 0.85, r * 0.85], [r * 0.85, r * 0.85]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y);
      ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6);
      ctx.stroke();
    });
    ctx.restore();
  }

  function motifDagger(ctx, cx, cy, r, ink, accent) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = ink; ctx.lineWidth = 2;
    // pommel
    circle(ctx, 0, -r * 0.85, 12, false, true);
    circle(ctx, 0, -r * 0.85, 5, true, false);
    // grip
    ctx.beginPath();
    ctx.moveTo(-6, -r * 0.78); ctx.lineTo(-6, -r * 0.45);
    ctx.lineTo(6, -r * 0.45); ctx.lineTo(6, -r * 0.78); ctx.closePath();
    ctx.stroke();
    // crossguard
    ctx.beginPath();
    ctx.moveTo(-r * 0.35, -r * 0.42); ctx.lineTo(r * 0.35, -r * 0.42);
    ctx.lineTo(r * 0.32, -r * 0.36); ctx.lineTo(-r * 0.32, -r * 0.36); ctx.closePath();
    ctx.stroke();
    // blade
    ctx.beginPath();
    ctx.moveTo(-r * 0.13, -r * 0.34);
    ctx.lineTo(r * 0.13, -r * 0.34);
    ctx.lineTo(0, r * 0.95);
    ctx.closePath();
    ctx.stroke();
    // blade midline
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.34); ctx.lineTo(0, r * 0.92); ctx.stroke();
    // crossguard accent gem
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.395 - 5); ctx.lineTo(5, -r * 0.395); ctx.lineTo(0, -r * 0.395 + 5); ctx.lineTo(-5, -r * 0.395); ctx.closePath();
    ctx.fill();
    // surrounding banner
    ctx.strokeStyle = ink; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.85, r * 0.45);
    ctx.bezierCurveTo(-r * 0.45, r * 0.25, r * 0.45, r * 0.25, r * 0.85, r * 0.45);
    ctx.bezierCurveTo(r * 0.45, r * 0.4, -r * 0.45, r * 0.4, -r * 0.85, r * 0.45);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.78, r * 0.43);
    ctx.lineTo(-r * 0.92, r * 0.55);
    ctx.lineTo(-r * 0.7, r * 0.5);
    ctx.moveTo(r * 0.78, r * 0.43);
    ctx.lineTo(r * 0.92, r * 0.55);
    ctx.lineTo(r * 0.7, r * 0.5);
    ctx.stroke();
    ctx.restore();
  }

  function motifMoth(ctx, cx, cy, r, ink, accent) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = ink; ctx.lineWidth = 1.4;
    // body — fat ellipse
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, r * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
    // body segments
    for (let i = -4; i <= 4; i++) {
      const y = i * (r * 0.12);
      ctx.beginPath();
      ctx.moveTo(-9, y); ctx.lineTo(9, y); ctx.stroke();
    }
    // upper wings
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.45);
      ctx.bezierCurveTo(s * r * 0.5, -r * 0.85, s * r * 0.95, -r * 0.5, s * r * 0.78, -r * 0.05);
      ctx.bezierCurveTo(s * r * 0.55, -r * 0.05, s * r * 0.15, -r * 0.15, 0, -r * 0.05);
      ctx.closePath();
      ctx.stroke();
    }
    // lower wings
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(s * r * 0.55, r * 0.1, s * r * 0.85, r * 0.45, s * r * 0.55, r * 0.7);
      ctx.bezierCurveTo(s * r * 0.3, r * 0.55, s * r * 0.1, r * 0.45, 0, r * 0.3);
      ctx.closePath();
      ctx.stroke();
    }
    // wing eye-spots
    for (const s of [-1, 1]) {
      circle(ctx, s * r * 0.5, -r * 0.35, r * 0.1, false, true);
      circle(ctx, s * r * 0.5, -r * 0.35, r * 0.04, true, false);
    }
    // antennae
    ctx.beginPath();
    ctx.moveTo(-3, -r * 0.6);
    ctx.bezierCurveTo(-r * 0.2, -r * 0.85, -r * 0.18, -r * 0.95, -r * 0.05, -r * 0.95);
    ctx.moveTo(3, -r * 0.6);
    ctx.bezierCurveTo(r * 0.2, -r * 0.85, r * 0.18, -r * 0.95, r * 0.05, -r * 0.95);
    ctx.stroke();
    // crown of crescent
    ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -r * 0.78, 9, 0, Math.PI, true);
    ctx.stroke();
    ctx.restore();
  }

  function motifHand(ctx, cx, cy, r, ink, accent) {
    ctx.save();
    ctx.translate(cx, cy + r * 0.05);
    ctx.strokeStyle = ink; ctx.lineWidth = 1.6;
    // palm outline
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, r * 0.6);
    ctx.lineTo(-r * 0.55, -r * 0.05);
    ctx.bezierCurveTo(-r * 0.55, -r * 0.2, -r * 0.42, -r * 0.25, -r * 0.4, -r * 0.5);
    ctx.lineTo(-r * 0.4, -r * 0.78);  // pinky tip
    ctx.bezierCurveTo(-r * 0.4, -r * 0.86, -r * 0.18, -r * 0.86, -r * 0.18, -r * 0.78);
    ctx.lineTo(-r * 0.18, -r * 0.6);  // ring base
    ctx.lineTo(-r * 0.18, -r * 0.88);  // ring tip
    ctx.bezierCurveTo(-r * 0.18, -r * 0.96, r * 0.02, -r * 0.96, r * 0.02, -r * 0.88);
    ctx.lineTo(r * 0.02, -r * 0.6);
    ctx.lineTo(r * 0.02, -r * 0.92);  // middle tip
    ctx.bezierCurveTo(r * 0.02, -r * 1.0, r * 0.22, -r * 1.0, r * 0.22, -r * 0.92);
    ctx.lineTo(r * 0.22, -r * 0.55);
    ctx.lineTo(r * 0.22, -r * 0.82);  // index
    ctx.bezierCurveTo(r * 0.22, -r * 0.9, r * 0.42, -r * 0.9, r * 0.42, -r * 0.82);
    ctx.lineTo(r * 0.42, -r * 0.3);
    ctx.lineTo(r * 0.55, -r * 0.05);
    ctx.lineTo(r * 0.55, r * 0.6);
    ctx.closePath();
    ctx.stroke();
    // thumb
    ctx.beginPath();
    ctx.moveTo(r * 0.42, -r * 0.3);
    ctx.bezierCurveTo(r * 0.65, -r * 0.2, r * 0.75, r * 0.05, r * 0.68, r * 0.2);
    ctx.stroke();
    // palm lines
    ctx.strokeStyle = ink; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, r * 0.05); ctx.bezierCurveTo(-r * 0.05, r * 0.0, r * 0.2, r * 0.05, r * 0.35, r * 0.18);
    ctx.moveTo(-r * 0.4, r * 0.2); ctx.bezierCurveTo(-r * 0.1, r * 0.15, r * 0.18, r * 0.22, r * 0.3, r * 0.35);
    ctx.moveTo(-r * 0.4, r * 0.35); ctx.bezierCurveTo(-r * 0.15, r * 0.5, r * 0.05, r * 0.55, r * 0.2, r * 0.55);
    ctx.stroke();
    // eye in palm
    ctx.strokeStyle = ink;
    ctx.beginPath();
    ctx.moveTo(-r * 0.18, -r * 0.05);
    ctx.bezierCurveTo(-r * 0.08, -r * 0.18, r * 0.08, -r * 0.18, r * 0.18, -r * 0.05);
    ctx.bezierCurveTo(r * 0.08, r * 0.08, -r * 0.08, r * 0.08, -r * 0.18, -r * 0.05);
    ctx.stroke();
    // pupil
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(0, -r * 0.06, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ink;
    ctx.beginPath(); ctx.arc(0, -r * 0.06, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function motifWave(ctx, cx, cy, r, ink, accent) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = ink; ctx.lineWidth = 1.8;
    // big spiral wave
    ctx.beginPath();
    ctx.moveTo(-r * 0.95, r * 0.4);
    ctx.bezierCurveTo(-r * 0.5, r * 0.4, -r * 0.7, -r * 0.5, -r * 0.2, -r * 0.5);
    ctx.bezierCurveTo(r * 0.15, -r * 0.5, r * 0.0, -r * 0.05, r * 0.25, -r * 0.05);
    ctx.bezierCurveTo(r * 0.45, -r * 0.05, r * 0.55, -r * 0.5, r * 0.85, -r * 0.45);
    ctx.stroke();
    // foam fingers (multiple curls)
    ctx.lineWidth = 1.4;
    const claws = [
      [-r * 0.55, -r * 0.42, 14],
      [-r * 0.3, -r * 0.5, 11],
      [0.0, -r * 0.45, 10],
      [r * 0.3, -r * 0.4, 12],
      [r * 0.6, -r * 0.5, 13]
    ];
    for (const [x, y, rad] of claws) {
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 1.7);
      ctx.stroke();
    }
    // droplets
    ctx.fillStyle = ink;
    [[-r * 0.78, -r * 0.7], [-r * 0.4, -r * 0.78], [r * 0.1, -r * 0.85], [r * 0.5, -r * 0.78], [r * 0.85, -r * 0.7]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.ellipse(x, y, 2.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    // sun above
    ctx.strokeStyle = ink;
    circle(ctx, r * 0.55, -r * 0.85, 12, false, true);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(r * 0.55 + Math.cos(a) * 16, -r * 0.85 + Math.sin(a) * 16);
      ctx.lineTo(r * 0.55 + Math.cos(a) * 22, -r * 0.85 + Math.sin(a) * 22);
      ctx.stroke();
    }
    // lower water lines
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1;
      const y = r * (0.55 + i * 0.13);
      ctx.moveTo(-r * 0.95, y);
      for (let x = -r * 0.95; x <= r * 0.95; x += 18) {
        ctx.lineTo(x, y + Math.sin(x * 0.04 + i) * 4);
      }
      ctx.stroke();
    }
    // accent — small red sun reflection
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(r * 0.55, r * 0.55, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function motifMoonPhases(ctx, cx, cy, r, ink, accent) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = ink; ctx.lineWidth = 1.4;
    // arch line
    ctx.beginPath();
    ctx.arc(0, r * 0.8, r * 0.95, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    // 5 moons along arc
    const phases = [0, 0.25, 0.5, 0.75, 1];
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      const ang = Math.PI * 1.15 + (Math.PI * 0.7) * t;
      const x = Math.cos(ang) * r * 0.95;
      const y = r * 0.8 + Math.sin(ang) * r * 0.95;
      const phase = phases[i];
      drawMoonPhase(ctx, x, y, 22, phase, ink);
    }
    // sun at top
    ctx.strokeStyle = ink;
    circle(ctx, 0, -r * 0.55, r * 0.25, false, true);
    circle(ctx, 0, -r * 0.55, r * 0.12, false, true);
    // sun rays
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.3, -r * 0.55 + Math.sin(a) * r * 0.3);
      ctx.lineTo(Math.cos(a) * r * 0.4, -r * 0.55 + Math.sin(a) * r * 0.4);
      ctx.stroke();
    }
    // central dot
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(0, -r * 0.55, 4, 0, Math.PI * 2); ctx.fill();
    // small stars scattered
    const r2 = rng(11);
    ctx.strokeStyle = ink;
    for (let i = 0; i < 14; i++) {
      const x = (r2() - 0.5) * r * 1.8;
      const y = (r2() - 0.5) * r * 1.4 - r * 0.1;
      // avoid centre of sun
      if (Math.hypot(x, y + r * 0.55) < r * 0.45) continue;
      if (Math.hypot(x, y - r * 0.8) < r) continue;
      ctx.beginPath();
      ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y);
      ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMoonPhase(ctx, x, y, r, phase, ink) {
    // phase 0 = new, 0.5 = full, 1 = new again
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = ink; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    // shaded portion
    ctx.fillStyle = ink;
    if (phase === 0 || phase === 1) {
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    } else if (phase === 0.5) {
      // full - just outline
    } else {
      ctx.beginPath();
      if (phase < 0.5) {
        // waxing — dark on left
        ctx.arc(0, 0, r, Math.PI * 0.5, Math.PI * 1.5);
        ctx.bezierCurveTo(r * (1 - phase * 4) * 0.5, r * 0.55, r * (1 - phase * 4) * 0.5, -r * 0.55, 0, -r);
      } else {
        // waning — dark on right
        const p = (phase - 0.5) * 2;
        ctx.arc(0, 0, r, Math.PI * 1.5, Math.PI * 0.5);
        ctx.bezierCurveTo(-r * (1 - p) * 0.5, -r * 0.55, -r * (1 - p) * 0.5, r * 0.55, 0, r);
      }
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function motifScript(ctx, cx, cy, r, ink, accent) {
    // a cursive script word + ornament. The word is drawn vector-ish from path commands.
    ctx.save();
    ctx.translate(cx, cy);
    // top eye-shape ornament
    ctx.strokeStyle = ink; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -r * 0.5);
    ctx.bezierCurveTo(-r * 0.3, -r * 0.7, r * 0.3, -r * 0.7, r * 0.6, -r * 0.5);
    ctx.bezierCurveTo(r * 0.3, -r * 0.3, -r * 0.3, -r * 0.3, -r * 0.6, -r * 0.5);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(0, -r * 0.5, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ink;
    ctx.beginPath(); ctx.arc(0, -r * 0.5, 2.2, 0, Math.PI * 2); ctx.fill();

    // word (italic serif)
    ctx.fillStyle = ink;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `italic 300 ${Math.floor(r * 0.55)}px 'Fraunces', 'Times New Roman', serif`;
    ctx.fillText("memento", 0, 0);
    ctx.font = `italic 300 ${Math.floor(r * 0.4)}px 'Fraunces', 'Times New Roman', serif`;
    ctx.fillText("mori", 0, r * 0.32);

    // flourish underline
    ctx.strokeStyle = ink; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, r * 0.55);
    ctx.bezierCurveTo(-r * 0.25, r * 0.7, r * 0.25, r * 0.4, r * 0.5, r * 0.55);
    ctx.stroke();
    // small ticks
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, r * 0.55); ctx.lineTo(-r * 0.65, r * 0.55);
    ctx.moveTo(r * 0.55, r * 0.55); ctx.lineTo(r * 0.65, r * 0.55);
    ctx.stroke();

    // stars below
    ctx.strokeStyle = ink;
    for (const x of [-r * 0.4, 0, r * 0.4]) {
      const y = r * 0.85;
      ctx.beginPath();
      ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y);
      ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function motifSkull(ctx, cx, cy, r, ink, accent) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = ink; ctx.lineWidth = 1.6;
    // cranium
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, 0);
    ctx.bezierCurveTo(-r * 0.55, -r * 0.7, r * 0.55, -r * 0.7, r * 0.55, 0);
    ctx.lineTo(r * 0.45, r * 0.1);
    ctx.lineTo(r * 0.4, r * 0.3);
    ctx.lineTo(r * 0.25, r * 0.35);
    ctx.lineTo(r * 0.18, r * 0.55);
    ctx.lineTo(-r * 0.18, r * 0.55);
    ctx.lineTo(-r * 0.25, r * 0.35);
    ctx.lineTo(-r * 0.4, r * 0.3);
    ctx.lineTo(-r * 0.45, r * 0.1);
    ctx.closePath();
    ctx.stroke();
    // eye sockets
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.ellipse(-r * 0.22, -r * 0.18, r * 0.13, r * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.ellipse(r * 0.22, -r * 0.18, r * 0.13, r * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    // nose
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.05); ctx.lineTo(-r * 0.06, r * 0.12); ctx.lineTo(r * 0.06, r * 0.12); ctx.closePath();
    ctx.fill();
    // teeth
    ctx.strokeStyle = ink; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.22, r * 0.35); ctx.lineTo(r * 0.22, r * 0.35);
    for (let i = -3; i <= 3; i++) {
      const x = i * (r * 0.06);
      ctx.moveTo(x, r * 0.35); ctx.lineTo(x, r * 0.5);
    }
    ctx.stroke();
    // crown of laurel
    ctx.strokeStyle = ink; ctx.lineWidth = 1.2;
    for (const side of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const t = i / 4;
        const ax = side * (r * 0.35 + t * r * 0.4);
        const ay = -r * 0.78 + t * t * r * 0.2;
        ctx.beginPath();
        ctx.ellipse(ax, ay, 8, 4, side * Math.PI * (0.2 - t * 0.4), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // forehead jewel
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.6 - 6); ctx.lineTo(6, -r * 0.6); ctx.lineTo(0, -r * 0.6 + 6); ctx.lineTo(-6, -r * 0.6); ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function motifRoseCompass(ctx, cx, cy, r, ink, accent) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = ink; ctx.lineWidth = 1.5;
    // outer ring
    circle(ctx, 0, 0, r, false, true);
    circle(ctx, 0, 0, r * 0.95, false, true);
    // degree marks
    ctx.lineWidth = 1;
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const len = i % 9 === 0 ? 18 : 8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r * 0.95), Math.sin(a) * (r * 0.95));
      ctx.lineTo(Math.cos(a) * (r * 0.95 - len), Math.sin(a) * (r * 0.95 - len));
      ctx.stroke();
    }
    // cardinal points
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
      const tip = r * 0.7, base = r * 0.18;
      const x0 = Math.cos(a) * tip, y0 = Math.sin(a) * tip;
      const a1 = a + Math.PI / 2, a2 = a - Math.PI / 2;
      const bx1 = Math.cos(a1) * base * 0.4, by1 = Math.sin(a1) * base * 0.4;
      const bx2 = Math.cos(a2) * base * 0.4, by2 = Math.sin(a2) * base * 0.4;
      ctx.moveTo(x0, y0); ctx.lineTo(bx1, by1); ctx.lineTo(bx2, by2); ctx.closePath();
    }
    ctx.stroke();
    // diagonal points (smaller)
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 - Math.PI / 4;
      const tip = r * 0.45, base = r * 0.1;
      const x0 = Math.cos(a) * tip, y0 = Math.sin(a) * tip;
      const a1 = a + Math.PI / 2, a2 = a - Math.PI / 2;
      const bx1 = Math.cos(a1) * base * 0.4, by1 = Math.sin(a1) * base * 0.4;
      const bx2 = Math.cos(a2) * base * 0.4, by2 = Math.sin(a2) * base * 0.4;
      ctx.beginPath();
      ctx.moveTo(x0, y0); ctx.lineTo(bx1, by1); ctx.lineTo(bx2, by2); ctx.closePath();
      ctx.stroke();
    }
    // central hub
    circle(ctx, 0, 0, r * 0.1, false, true);
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.05, 0, Math.PI * 2); ctx.fill();
    // N label
    ctx.fillStyle = ink;
    ctx.font = "500 18px 'JetBrains Mono', monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.fillText("N", 0, -r * 0.75);
    ctx.restore();
  }

  /* ---------- helpers --------------------------------------- */
  function circle(ctx, x, y, r, fill, stroke) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) ctx.fill(); if (stroke) ctx.stroke();
  }
  function polygon(ctx, cx, cy, r, n, rot) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (rot || 0);
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.stroke();
  }

  /* =========================================================
     CATALOG — fixed metadata so each card has a stable identity.
     The motif fn is chosen by motif key.
     ========================================================= */
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
    compass: motifRoseCompass
  };

  const CATALOG = [
    { motif: "compass", title: "Norte verdadero",     style: "Ornamental · Línea fina",    artist: "Iria L.",    year: "2025", size: "14 × 14 cm", session: "3 — 4 h" },
    { motif: "serpent", title: "Ouroboros",            style: "Blackwork · Línea",          artist: "Mateo R.",   year: "2025", size: "10 × 22 cm", session: "4 — 5 h" },
    { motif: "moth",    title: "Polilla luna",         style: "Línea fina · Dotwork",       artist: "Iria L.",    year: "2024", size: "12 × 16 cm", session: "3 h"     },
    { motif: "mandala", title: "Vesica",               style: "Sacred geometry",            artist: "Júlia C.",   year: "2025", size: "16 × 16 cm", session: "5 h"     },
    { motif: "botanical", title: "Hierbabuena",        style: "Botánica · Microrealismo",   artist: "Iria L.",    year: "2024", size: "9 × 20 cm",  session: "3 h"     },
    { motif: "dagger",  title: "Hoja partida",         style: "Tradicional · Blackwork",    artist: "Mateo R.",   year: "2025", size: "8 × 22 cm",  session: "4 h"     },
    { motif: "hand",    title: "Mano que ve",          style: "Ornamental · Esoterismo",   artist: "Júlia C.",   year: "2024", size: "13 × 18 cm", session: "5 h"     },
    { motif: "wave",    title: "Kanagawa",             style: "Neo-japonés · Línea",        artist: "Mateo R.",   year: "2025", size: "20 × 14 cm", session: "6 h"     },
    { motif: "moon",    title: "Fases · 1.II",         style: "Microrealismo · Dotwork",    artist: "Iria L.",    year: "2024", size: "18 × 6 cm",  session: "2 — 3 h" },
    { motif: "script",  title: "Memento",              style: "Lettering · Cursiva",        artist: "Júlia C.",   year: "2025", size: "12 × 7 cm",  session: "2 h"     },
    { motif: "skull",   title: "Vanitas",              style: "Neo-tradicional",            artist: "Mateo R.",   year: "2024", size: "12 × 16 cm", session: "5 — 6 h" },
    { motif: "geometric", title: "Vesica II",          style: "Geométrico · Línea fina",    artist: "Júlia C.",   year: "2025", size: "10 × 14 cm", session: "3 h"     }
  ];

  /* =========================================================
     BUILD — returns an HTMLCanvasElement for a given catalog idx
     ========================================================= */
  function build(opts) {
    const { index, total, paper = "cream", accent = "#e94560" } = opts;
    const item = CATALOG[index % CATALOG.length];
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");

    const p = drawPaper(ctx, W, H, paper);
    const meta = {
      indexLabel: `N° ${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
      title: item.title,
      style: item.style,
      artist: item.artist,
      year: item.year
    };

    // motif inside a centered box
    const cx = W / 2, cy = H / 2 - 30;
    const r = Math.min(W, H) * 0.32;
    const fn = MOTIF_FNS[item.motif] || motifMandala;
    fn(ctx, cx, cy, r, p.ink, accent);

    drawFrame(ctx, W, H, p, accent, meta);
    return { canvas: cv, item, meta };
  }

  window.SX_FLASH = { build, CATALOG, PAPERS };
})();
