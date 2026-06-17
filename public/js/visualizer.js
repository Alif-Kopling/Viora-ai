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

    this.resize();
    this.initParticles();

    window.addEventListener("resize", () => this.resize());
    this.canvas.addEventListener("dblclick", () => {
      this.mode = this.mode === 'bar' ? 'circle' : 'bar';
    });
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

    if (this.amplitude < 0.003) {
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
}
