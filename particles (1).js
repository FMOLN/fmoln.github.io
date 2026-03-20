/**
 * FMOLN — Luxury Gold Particle System
 * Three particle types: dust specks, glowing orbs, metallic flakes
 * Cursor reactive · Sparse elegant · Central cluster distribution
 */

(function () {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  let mouse = { x: -9999, y: -9999 };
  let particles = [];
  let animFrame;

  // ─── CONFIG ───────────────────────────────────────────
  const CONFIG = {
    dustCount:  55,   // tiny sharp specks
    orbCount:   28,   // medium glowing orbs
    flakeCount: 14,   // large metallic flakes
    connectionRadius: 90,   // hover line connection distance
    mouseRadius:      130,  // cursor repel radius
    mouseForce:       2.2,  // how hard cursor pushes
  };

  // ─── RESIZE ───────────────────────────────────────────
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = document.documentElement.scrollHeight;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
  }

  // ─── GOLD COLOR HELPERS ───────────────────────────────
  function goldColor(alpha) {
    const shades = [
      `255,215,0`,    // #FFD700 pure gold
      `255,234,158`,  // #FFEA9E warm highlight
      `255,248,225`,  // #FFF8E1 white-gold
      `240,180,50`,   // deeper gold
      `255,200,80`,   // mid gold
    ];
    const c = shades[Math.floor(Math.random() * shades.length)];
    return `rgba(${c},${alpha})`;
  }

  // ─── CENTRAL CLUSTER DISTRIBUTION ────────────────────
  // Most particles in center 40%, spreading outward
  function clusterX() {
    const r = Math.random();
    if (r < 0.65) {
      // Central 40%
      return W * 0.3 + Math.random() * W * 0.4;
    } else {
      return Math.random() * W;
    }
  }
  function clusterY() {
    const r = Math.random();
    if (r < 0.65) {
      return H * 0.2 + Math.random() * H * 0.6;
    } else {
      return Math.random() * H;
    }
  }

  // ─── BASE PARTICLE ────────────────────────────────────
  class BaseParticle {
    constructor() { this.init(); }
    init() {
      this.x = clusterX();
      this.y = clusterY();
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.3 + 0.15; // slight downward drift
      this.life = 0;
      this.maxLife = 300 + Math.random() * 400;
      this.born = false;
    }
    fadeOpacity() {
      const fadeIn  = 60;
      const fadeOut = 80;
      if (this.life < fadeIn)  return this.life / fadeIn;
      if (this.life > this.maxLife - fadeOut) return (this.maxLife - this.life) / fadeOut;
      return 1;
    }
    move() {
      // Gentle sway
      this.vx += (Math.random() - 0.5) * 0.02;
      this.vy += (Math.random() - 0.5) * 0.015;
      // Clamp speed
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > this.maxSpeed) {
        this.vx = (this.vx / speed) * this.maxSpeed;
        this.vy = (this.vy / speed) * this.maxSpeed;
      }
      // Cursor repel
      const scrollY = window.scrollY || 0;
      const mx = mouse.x;
      const my = mouse.y + scrollY;
      const dx = this.x - mx;
      const dy = this.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONFIG.mouseRadius && dist > 0) {
        const force = (CONFIG.mouseRadius - dist) / CONFIG.mouseRadius;
        const ang = Math.atan2(dy, dx);
        this.vx += Math.cos(ang) * force * CONFIG.mouseForce * 0.4;
        this.vy += Math.sin(ang) * force * CONFIG.mouseForce * 0.4;
      }
      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      if (this.life >= this.maxLife) this.init();
      // Edge wrap with fade
      if (this.x < -30) this.x = W + 20;
      if (this.x > W + 30) this.x = -20;
    }
  }

  // ─── TYPE 1: DUST SPECKS ──────────────────────────────
  class DustSpeck extends BaseParticle {
    init() {
      super.init();
      this.size = 0.8 + Math.random() * 2.2; // 0.8–3px
      this.maxSpeed = 0.55;
      this.baseAlpha = 0.6 + Math.random() * 0.4;
      this.color = `255,${185 + Math.floor(Math.random()*70)},${Math.floor(Math.random()*60)}`;
      this.twinkle = Math.random() * Math.PI * 2;
      this.twinkleSpeed = 0.03 + Math.random() * 0.04;
    }
    draw() {
      const alpha = this.fadeOpacity() * this.baseAlpha;
      if (alpha <= 0) return;
      this.twinkle += this.twinkleSpeed;
      const twinkAlpha = alpha * (0.7 + Math.sin(this.twinkle) * 0.3);
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color},${twinkAlpha})`;
      ctx.shadowBlur = this.size * 3;
      ctx.shadowColor = `rgba(255,215,0,${twinkAlpha * 0.6})`;
      ctx.fill();
      ctx.restore();
    }
  }

  // ─── TYPE 2: GLOWING ORBS (BOKEH) ────────────────────
  class GlowOrb extends BaseParticle {
    init() {
      super.init();
      this.size = 4 + Math.random() * 4;   // 4–8px
      this.maxSpeed = 0.38;
      this.baseAlpha = 0.45 + Math.random() * 0.35;
      this.glowSize = this.size * (4 + Math.random() * 4);
      this.pulse = Math.random() * Math.PI * 2;
      this.pulseSpeed = 0.015 + Math.random() * 0.02;
    }
    draw() {
      const alpha = this.fadeOpacity() * this.baseAlpha;
      if (alpha <= 0) return;
      this.pulse += this.pulseSpeed;
      const pAlpha = alpha * (0.85 + Math.sin(this.pulse) * 0.15);
      const gAlpha = pAlpha * (0.8 + Math.sin(this.pulse + 1) * 0.2);
      ctx.save();
      // Outer bokeh glow — multiple radial gradients for soft bokeh
      const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.glowSize);
      glow.addColorStop(0,   `rgba(255,240,160,${gAlpha * 0.5})`);
      glow.addColorStop(0.2, `rgba(255,215,0,${gAlpha * 0.35})`);
      glow.addColorStop(0.5, `rgba(240,180,50,${gAlpha * 0.12})`);
      glow.addColorStop(1,   `rgba(201,168,76,0)`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.glowSize, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
      // Bright center core
      const core = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
      core.addColorStop(0,   `rgba(255,248,225,${pAlpha})`);
      core.addColorStop(0.4, `rgba(255,215,0,${pAlpha * 0.9})`);
      core.addColorStop(1,   `rgba(255,180,50,${pAlpha * 0.3})`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = core;
      ctx.fill();
      ctx.restore();
    }
  }

  // ─── TYPE 3: METALLIC FLAKES ──────────────────────────
  class MetallicFlake extends BaseParticle {
    init() {
      super.init();
      this.size = 9 + Math.random() * 9;  // 9–18px
      this.maxSpeed = 0.28;
      this.baseAlpha = 0.55 + Math.random() * 0.3;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.008;
      this.sides = 4 + Math.floor(Math.random() * 3); // 4–6 sides for irregular shape
      this.irregularity = 0.3 + Math.random() * 0.4; // shape irregularity
      this.shineOffset = Math.random() * Math.PI * 2;
      this.shineSpeed = 0.01 + Math.random() * 0.015;
      // Pre-generate irregular shape points
      this.points = [];
      for (let i = 0; i < this.sides; i++) {
        const angle = (i / this.sides) * Math.PI * 2;
        const r = this.size * (0.7 + Math.random() * this.irregularity);
        this.points.push({ r, angle });
      }
    }
    draw() {
      const alpha = this.fadeOpacity() * this.baseAlpha;
      if (alpha <= 0) return;
      this.rotation += this.rotSpeed;
      this.shineOffset += this.shineSpeed;
      const shine = 0.5 + Math.sin(this.shineOffset) * 0.5; // 0–1
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      // Outer glow
      ctx.shadowBlur = this.size * 2.5;
      ctx.shadowColor = `rgba(255,215,0,${alpha * 0.5})`;
      // Draw irregular polygon
      ctx.beginPath();
      this.points.forEach((p, i) => {
        const x = Math.cos(p.angle) * p.r;
        const y = Math.sin(p.angle) * p.r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      // Metallic gradient fill
      const grad = ctx.createLinearGradient(-this.size, -this.size, this.size, this.size);
      grad.addColorStop(0,           `rgba(255,248,225,${alpha * (0.4 + shine * 0.6)})`);
      grad.addColorStop(0.3,         `rgba(255,215,0,${alpha})`);
      grad.addColorStop(0.5 + shine * 0.2, `rgba(255,248,225,${alpha * (0.3 + shine * 0.7)})`);
      grad.addColorStop(0.7,         `rgba(200,150,40,${alpha * 0.8})`);
      grad.addColorStop(1,           `rgba(160,110,20,${alpha * 0.5})`);
      ctx.fillStyle = grad;
      ctx.fill();
      // Specular highlight — small bright spot
      const specX = -this.size * 0.2 * Math.cos(this.shineOffset);
      const specY = -this.size * 0.2 * Math.sin(this.shineOffset);
      const specGrad = ctx.createRadialGradient(specX, specY, 0, specX, specY, this.size * 0.4);
      specGrad.addColorStop(0, `rgba(255,255,255,${shine * alpha * 0.9})`);
      specGrad.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.fillStyle = specGrad;
      ctx.fill();
      // Thin gold edge
      ctx.strokeStyle = `rgba(255,220,100,${alpha * 0.4})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  // ─── INIT PARTICLES ───────────────────────────────────
  function initParticles() {
    particles = [];
    for (let i = 0; i < CONFIG.dustCount;  i++) particles.push(new DustSpeck());
    for (let i = 0; i < CONFIG.orbCount;   i++) particles.push(new GlowOrb());
    for (let i = 0; i < CONFIG.flakeCount; i++) particles.push(new MetallicFlake());
    // Stagger life so they don't all appear at once
    particles.forEach(p => { p.life = Math.floor(Math.random() * p.maxLife * 0.7); });
  }

  // ─── DRAW CONNECTIONS ─────────────────────────────────
  function drawConnections() {
    const scrollY = window.scrollY || 0;
    const mx = mouse.x;
    const my = mouse.y + scrollY;
    // Only draw lines between particles near the cursor
    const near = particles.filter(p => {
      const dx = p.x - mx, dy = p.y - my;
      return Math.sqrt(dx*dx + dy*dy) < CONFIG.connectionRadius * 1.8;
    });
    for (let i = 0; i < near.length; i++) {
      for (let j = i + 1; j < near.length; j++) {
        const dx = near[i].x - near[j].x;
        const dy = near[i].y - near[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < CONFIG.connectionRadius) {
          const alpha = (1 - dist / CONFIG.connectionRadius) * 0.25;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(near[i].x, near[i].y);
          ctx.lineTo(near[j].x, near[j].y);
          ctx.strokeStyle = `rgba(255,215,0,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  // ─── ANIMATION LOOP ───────────────────────────────────
  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.move(); p.draw(); });
    drawConnections();
    animFrame = requestAnimationFrame(animate);
  }

  // ─── EVENTS ───────────────────────────────────────────
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
  window.addEventListener('resize', () => { resize(); initParticles(); });

  // Resize on scroll to cover full page height
  let scrollTimer;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => { resize(); }, 100);
  });

  // ─── BOOT ─────────────────────────────────────────────
  resize();
  initParticles();
  animate();

  // Mobile: touch support
  window.addEventListener('touchmove', e => {
    const t = e.touches[0];
    mouse.x = t.clientX;
    mouse.y = t.clientY;
  }, { passive: true });

})();
