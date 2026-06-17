const MOOD_FACES = {
  happy:   { eyes: 'dot',   brows: 'up',    mouth: 'smile',  decor: null },
  angry:   { eyes: 'cross', brows: 'angry',  mouth: 'zigzag', decor: 'bang' },
  sad:     { eyes: 'dot',   brows: 'down',   mouth: 'frown',  decor: 'tears' },
  sleepy:  { eyes: 'line',  brows: 'low',    mouth: 'flat',   decor: 'zzz' },
  hungry:  { eyes: 'wide',  brows: 'up',     mouth: 'wide',   decor: 'drool' },
  love:    { eyes: 'heart', brows: 'up',     mouth: 'smile',  decor: 'hearts' },
  confused:{ eyes: 'dot',   brows: 'asym',   mouth: 'gap',    decor: 'question' },
  excited: { eyes: 'big',   brows: 'up',     mouth: 'joy',    decor: 'sparkles' }
};

class Visualizer {
  constructor(canvasId, opts = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.barCount = opts.barCount ?? 64;
    this.particleCount = opts.particleCount ?? 80;

    this.amplitude = 0;
    this.targetAmplitude = 0;
    this.smoothed = new Array(this.barCount).fill(0);
    this.targets = new Array(this.barCount).fill(0);
    this.time = 0;
    this.frameId = null;
    this.colorPhase = 0;

    this.particles = [];
    this.mode = opts.mode ?? 'bar';

    this.moodFace = null;
    this.moodOpacity = 0;
    this.moodScale = 0;
    this.moodTimer = null;
    this.moodOverlay = document.getElementById('moodOverlay');

    this.resize();
    this.initParticles();

    window.addEventListener("resize", () => this.resize());
    this.canvas.addEventListener("dblclick", () => {
      this.mode = this.mode === 'bar' ? 'circle' : 'bar';
    });
  }

  showMood(mood) {
    const data = MOOD_FACES[mood];
    if (!data) return;

    if (this.moodTimer) clearTimeout(this.moodTimer);

    this.moodFace = { mood, data, startTime: performance.now(), duration: 5000 };
    this.moodOpacity = 0;
    this.moodScale = 0;
    this.moodOverlay.classList.add('active');

    this.moodTimer = setTimeout(() => this.clearMood(), 5000);
  }

  clearMood() {
    if (this.moodTimer) { clearTimeout(this.moodTimer); this.moodTimer = null; }
    this.moodFace = null;
    this.moodOpacity = 0;
    this.moodOverlay.classList.remove('active');
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.003 + 0.001,
        drift: (Math.random() - 0.5) * 0.002,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }
  }

  start() {
    this.targetAmplitude = 1;
    if (!this.frameId) this.loop();
  }

  stop() {
    this.targetAmplitude = 0;
  }

  getColor(i, barH, maxH) {
    const t = i / this.barCount;
    const hue = (200 + t * 60 + this.colorPhase * 30) % 360;
    const sat = 70 + this.smoothed[i] * 30;
    const lit = 40 + (barH / maxH) * 30;
    return { hue, sat, lit };
  }

  drawBarMode(w, h) {
    const ctx = this.ctx;
    const time = Date.now() / 1000;
    const barW = w / this.barCount;
    const maxH = h * 0.38;
    const gap = Math.max(barW * 0.15, 1);
    const bw = Math.max(barW - gap, 1);
    const radius = Math.min(bw * 0.3, 4);
    const cx = w / 2;

    const gradient = ctx.createLinearGradient(0, h / 2 - maxH, 0, h / 2 + maxH);
    gradient.addColorStop(0, `hsl(${(220 + this.colorPhase * 20) % 360}, 80%, 55%)`);
    gradient.addColorStop(0.5, `hsl(${(260 + this.colorPhase * 20) % 360}, 80%, 65%)`);
    gradient.addColorStop(1, `hsl(${(300 + this.colorPhase * 20) % 360}, 80%, 55%)`);

    for (let i = 0; i < this.barCount; i++) {
      const phase = (i / this.barCount) * Math.PI * 4 + time * 2.5;
      const raw = Math.abs(Math.sin(phase)) * 0.85 + Math.random() * 0.15;
      const target = raw * this.amplitude;
      this.smoothed[i] += (target - this.smoothed[i]) * 0.12;

      const barH = Math.max(this.smoothed[i] * maxH, 0.5);
      const x = i * barW + gap / 2;

      const { hue, sat, lit } = this.getColor(i, barH, maxH);

      ctx.save();
      ctx.shadowColor = `hsla(${hue}, ${sat}%, ${lit}%, 0.5)`;
      ctx.shadowBlur = barH * 0.3 + 4;

      const alpha = 0.4 + this.smoothed[i] * 0.6;
      ctx.fillStyle = `hsla(${hue}, ${sat}%, ${lit}%, ${alpha})`;

      const cy = h / 2;
      ctx.beginPath();
      ctx.roundRect(x, cy - barH, bw, barH * 2, radius);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.shadowColor = `hsla(${(240 + this.colorPhase * 20) % 360}, 80%, 60%, 0.15)`;
    ctx.shadowBlur = 40;

    ctx.fillStyle = `hsla(${(240 + this.colorPhase * 20) % 360}, 80%, 60%, 0.03)`;
    ctx.beginPath();
    ctx.roundRect(cx - w * 0.3, h / 2 - maxH * 0.5, w * 0.6, maxH, maxH * 0.3);
    ctx.fill();
    ctx.restore();
  }

  drawCircleMode(w, h) {
    const ctx = this.ctx;
    const time = Date.now() / 1000;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.28;
    const barW = (Math.PI * 2 * radius) / this.barCount;
    const gap = Math.max(barW * 0.1, 1);
    const bw = Math.max(barW - gap, 1);
    const maxH = Math.min(w, h) * 0.12;

    ctx.save();
    ctx.translate(cx, cy);

    for (let i = 0; i < this.barCount; i++) {
      const phase = (i / this.barCount) * Math.PI * 4 + time * 2.5;
      const raw = Math.abs(Math.sin(phase)) * 0.85 + Math.random() * 0.15;
      const target = raw * this.amplitude;
      this.smoothed[i] += (target - this.smoothed[i]) * 0.12;

      const barH = Math.max(this.smoothed[i] * maxH, 0.5);
      const angle = (i / this.barCount) * Math.PI * 2 - Math.PI / 2;
      const { hue, sat, lit } = this.getColor(i, barH, maxH);

      ctx.save();
      ctx.rotate(angle);

      ctx.shadowColor = `hsla(${hue}, ${sat}%, ${lit}%, 0.5)`;
      ctx.shadowBlur = barH * 0.3 + 4;

      const alpha = 0.4 + this.smoothed[i] * 0.6;
      ctx.fillStyle = `hsla(${hue}, ${sat}%, ${lit}%, ${alpha})`;

      const x = -bw / 2;
      ctx.beginPath();
      ctx.roundRect(x, radius - 2, bw, barH, Math.min(bw * 0.3, 3));
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    ctx.save();
    ctx.shadowColor = `hsla(${(240 + this.colorPhase * 20) % 360}, 80%, 60%, 0.1)`;
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${(240 + this.colorPhase * 20) % 360}, 80%, 60%, 0.02)`;
    ctx.fill();
    ctx.restore();
  }

  drawParticles(w, h) {
    const ctx = this.ctx;
    for (const p of this.particles) {
      p.y += p.speed * this.amplitude * 2;
      p.x += p.drift * this.amplitude * 3;

      if (p.y > 1) { p.y = 0; p.x = Math.random(); }
      if (p.x < 0 || p.x > 1) p.drift *= -1;

      const alpha = p.opacity * (0.3 + this.amplitude * 0.7);
      ctx.fillStyle = `hsla(${(240 + this.colorPhase * 30) % 360}, 70%, 70%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  loop() {
    this.amplitude += (this.targetAmplitude - this.amplitude) * 0.06;
    this.colorPhase += 0.001;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (this.moodFace) {
      this.drawMoodFace(w, h);
    } else if (this.amplitude < 0.003) {
      this.drawIdle(w, h);
    } else {
      this.drawParticles(w, h);
      if (this.mode === 'bar') {
        this.drawBarMode(w, h);
      } else {
        this.drawCircleMode(w, h);
      }
    }

    this.frameId = requestAnimationFrame(() => this.loop());
  }

  drawIdle(w, h) {
    const ctx = this.ctx;
    const cy = h / 2;
    const pulse = Math.sin(Date.now() / 2000) * 0.2 + 0.8;

    ctx.save();
    ctx.shadowColor = `hsla(${(240 + this.colorPhase * 20) % 360}, 80%, 60%, ${0.08 * pulse})`;
    ctx.shadowBlur = 20;

    ctx.strokeStyle = `hsla(${(240 + this.colorPhase * 20) % 360}, 80%, 60%, ${0.15 * pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();
    ctx.restore();

    for (const p of this.particles) {
      p.y += p.speed * 0.3;
      p.x += p.drift * 0.5;
      if (p.y > 1) { p.y = 0; p.x = Math.random(); }
      if (p.x < 0 || p.x > 1) p.drift *= -1;

      const alpha = p.opacity * 0.3;
      ctx.fillStyle = `hsla(${(240 + this.colorPhase * 30) % 360}, 70%, 70%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, p.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawMoodFace(w, h) {
    const elapsed = performance.now() - this.moodFace.startTime;
    const { duration } = this.moodFace;

    if (elapsed > duration + 600) {
      this.moodFace = null;
      this.moodOpacity = 0;
      return;
    }

    if (elapsed < 400) {
      this.moodOpacity = Math.min(elapsed / 400, 1);
      this.moodScale = Math.min(elapsed / 400, 1);
    } else if (elapsed < duration) {
      this.moodOpacity = 1;
      this.moodScale = 1;
    } else {
      this.moodOpacity = Math.max(0, 1 - (elapsed - duration) / 600);
    }

    const ctx = this.ctx;
    const cx = w / 2;
    const cy = h / 2;
    const faceSize = Math.min(w, h) * 0.55;
    const s = faceSize / 60;
    const d = this.moodFace.data;
    const ct = performance.now() / 1000;

    ctx.save();
    ctx.globalAlpha = this.moodOpacity;
    ctx.translate(cx, cy);
    ctx.scale(s * this.moodScale, s * this.moodScale);

    const ly = -2;

    ctx.strokeStyle = 'rgba(34, 211, 238, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    const bhy = ly - 9;

    if (d.brows === 'up') {
      ctx.beginPath(); ctx.moveTo(-13, bhy + 3); ctx.lineTo(-7, bhy - 1); ctx.lineTo(-1, bhy + 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(1, bhy + 3); ctx.lineTo(7, bhy - 1); ctx.lineTo(13, bhy + 3); ctx.stroke();
    } else if (d.brows === 'down') {
      ctx.beginPath(); ctx.moveTo(-13, bhy); ctx.lineTo(-7, bhy + 4); ctx.lineTo(-1, bhy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(1, bhy); ctx.lineTo(7, bhy + 4); ctx.lineTo(13, bhy); ctx.stroke();
    } else if (d.brows === 'angry') {
      ctx.beginPath(); ctx.moveTo(-13, bhy); ctx.lineTo(-1, bhy + 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(13, bhy); ctx.lineTo(1, bhy + 6); ctx.stroke();
    } else if (d.brows === 'low') {
      ctx.beginPath(); ctx.moveTo(-13, bhy + 3); ctx.lineTo(-1, bhy + 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(1, bhy + 3); ctx.lineTo(13, bhy + 3); ctx.stroke();
    } else if (d.brows === 'asym') {
      ctx.beginPath(); ctx.moveTo(-13, bhy + 3); ctx.lineTo(-1, bhy + 1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(1, bhy + 1); ctx.lineTo(13, bhy + 5); ctx.stroke();
    }

    ctx.fillStyle = 'rgba(34, 211, 238, 0.85)';
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.85)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    if (d.eyes === 'dot') {
      ctx.beginPath(); ctx.arc(-10, ly, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(10, ly, 3.5, 0, Math.PI * 2); ctx.fill();
    } else if (d.eyes === 'cross') {
      ctx.beginPath();
      ctx.moveTo(-14, ly - 3); ctx.lineTo(-6, ly + 3);
      ctx.moveTo(-14, ly + 3); ctx.lineTo(-6, ly - 3);
      ctx.moveTo(6, ly - 3); ctx.lineTo(14, ly + 3);
      ctx.moveTo(6, ly + 3); ctx.lineTo(14, ly - 3);
      ctx.stroke();
    } else if (d.eyes === 'heart') {
      ctx.fillStyle = 'rgba(233, 69, 96, 0.85)';
      ctx.fill(new Path2D('M-10,-1 C-10,-5 -15,-5 -15,-1 C-15,3 -10,7 -10,7 C-10,7 -5,3 -5,-1 C-5,-5 -10,-5 -10,-1'));
      ctx.fill(new Path2D('M10,-1 C10,-5 5,-5 5,-1 C5,3 10,7 10,7 C10,7 15,3 15,-1 C15,-5 10,-5 10,-1'));
      ctx.fillStyle = 'rgba(34, 211, 238, 0.85)';
    } else if (d.eyes === 'line') {
      ctx.beginPath(); ctx.moveTo(-14, ly); ctx.lineTo(-6, ly); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6, ly); ctx.lineTo(14, ly); ctx.stroke();
    } else if (d.eyes === 'big') {
      ctx.fillRect(-14, ly - 4, 9, 9);
      ctx.fillRect(5, ly - 4, 9, 9);
    } else if (d.eyes === 'wide') {
      ctx.strokeRect(-14, ly - 4, 9, 9);
      ctx.strokeRect(5, ly - 4, 9, 9);
      ctx.beginPath(); ctx.arc(-9.5, ly, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(9.5, ly, 2, 0, Math.PI * 2); ctx.fill();
    }

    ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    const my2 = ly + 14;

    if (d.mouth === 'smile') {
      ctx.beginPath(); ctx.moveTo(-11, my2); ctx.lineTo(-6, my2 + 4); ctx.lineTo(0, my2 + 5);
      ctx.lineTo(6, my2 + 4); ctx.lineTo(11, my2); ctx.stroke();
    } else if (d.mouth === 'frown') {
      ctx.beginPath(); ctx.moveTo(-11, my2 + 5); ctx.lineTo(-6, my2 + 1); ctx.lineTo(0, my2);
      ctx.lineTo(6, my2 + 1); ctx.lineTo(11, my2 + 5); ctx.stroke();
    } else if (d.mouth === 'flat') {
      ctx.beginPath(); ctx.moveTo(-11, my2 + 2); ctx.lineTo(11, my2 + 2); ctx.stroke();
    } else if (d.mouth === 'zigzag') {
      ctx.beginPath();
      ctx.moveTo(-11, my2 + 2); ctx.lineTo(-6, my2 - 2); ctx.lineTo(0, my2 + 2);
      ctx.lineTo(6, my2 - 2); ctx.lineTo(11, my2 + 2); ctx.stroke();
    } else if (d.mouth === 'wide') {
      ctx.beginPath();
      ctx.moveTo(-11, my2 + 2); ctx.lineTo(-6, my2 + 5); ctx.lineTo(0, my2 + 6);
      ctx.lineTo(6, my2 + 5); ctx.lineTo(11, my2 + 2); ctx.stroke();
    } else if (d.mouth === 'gap') {
      ctx.beginPath(); ctx.moveTo(-9, my2); ctx.lineTo(-3, my2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(3, my2 + 4); ctx.lineTo(9, my2 + 4); ctx.stroke();
    } else if (d.mouth === 'joy') {
      ctx.beginPath(); ctx.moveTo(-13, my2); ctx.lineTo(-7, my2 + 5); ctx.lineTo(0, my2 + 7);
      ctx.lineTo(7, my2 + 5); ctx.lineTo(13, my2); ctx.stroke();
    }

    ctx.restore();

    if (d.decor) {
      ctx.save();
      ctx.globalAlpha = this.moodOpacity;
      this.drawDecor(ctx, d.decor, cx, cy, s * this.moodScale, ct);
      ctx.restore();
    }
  }

  drawDecor(ctx, type, cx, cy, s, t) {
    if (type === 'tears') {
      ctx.fillStyle = 'rgba(34, 211, 238, 0.65)';
      const y1 = Math.sin(t * 2) * 1.5;
      const y2 = Math.sin(t * 2 + 1) * 1.5;
      ctx.beginPath();
      ctx.roundRect(cx - 18 * s, cy - 12 * s + y1, 3 * s, 5 * s, 1.5 * s);
      ctx.roundRect(cx + 15 * s, cy - 12 * s + y2, 3 * s, 5 * s, 1.5 * s);
      ctx.fill();
    } else if (type === 'zzz') {
      ctx.fillStyle = 'rgba(34, 211, 238, 0.5)';
      for (let i = 0; i < 3; i++) {
        const drift = Math.sin(t * 1.5 + i * 2) * 1.5 * s;
        ctx.font = `${(8 + i * 2) * s}px monospace`;
        ctx.fillText('Z', cx + (12 + i * 4) * s + drift, cy - (20 - i * 5) * s);
      }
    } else if (type === 'drool') {
      const droop = Math.sin(t * 1.2) * 1.5 + 2;
      ctx.fillStyle = 'rgba(34, 211, 238, 0.3)';
      ctx.beginPath();
      ctx.arc(cx - 4 * s, cy + 18 * s + droop, 2.5 * s, 0, Math.PI * 2);
      ctx.arc(cx + 4 * s, cy + 20 * s + droop, 1.8 * s, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'hearts') {
      ctx.fillStyle = 'rgba(233, 69, 96, 0.55)';
      for (let i = 0; i < 3; i++) {
        const float = Math.sin(t * 2 + i * 1.5) * 3 * s;
        ctx.font = `${(7 + i * 2) * s}px sans-serif`;
        ctx.fillText('♥', cx + (-16 + i * 14) * s, cy - (22 + float / s) * s);
      }
    } else if (type === 'question') {
      ctx.fillStyle = 'rgba(34, 211, 238, 0.65)';
      ctx.font = `bold ${12 * s}px monospace`;
      const wobble = Math.sin(t * 2.5) * 1.5 * s;
      ctx.fillText('?', cx + 16 * s + wobble, cy - 16 * s);
    } else if (type === 'sparkles') {
      ctx.fillStyle = 'rgba(34, 211, 238, 0.65)';
      for (let i = 0; i < 3; i++) {
        const ph = t * 2 + i * 2;
        const sx = cx + (-16 + i * 14) * s + Math.sin(ph) * 2 * s;
        const sy = cy - (18 + Math.sin(ph + 1) * 2) * s;
        const r = (1.5 + Math.sin(ph) * 0.5) * s;
        ctx.beginPath();
        for (let j = 0; j < 4; j++) {
          const a = (j / 4) * Math.PI * 2 - Math.PI / 2;
          const px = Math.cos(a) * r, py = Math.sin(a) * r;
          if (j === 0) ctx.moveTo(sx + px, sy + py);
          else ctx.lineTo(sx + px, sy + py);
          const a2 = a + Math.PI / 4;
          ctx.lineTo(sx + Math.cos(a2) * r * 0.35, sy + Math.sin(a2) * r * 0.35);
        }
        ctx.closePath();
        ctx.fill();
      }
    } else if (type === 'bang') {
      ctx.fillStyle = 'rgba(233, 69, 96, 0.7)';
      ctx.font = `bold ${14 * s}px monospace`;
      const shake = Math.sin(t * 10) * 1.5 * s;
      ctx.fillText('!', cx + 18 * s + shake, cy - 16 * s);
    }
  }
}