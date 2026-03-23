/**
 * FMOLN — Liquid Gold Flow Field
 * Perlin noise driven flow field simulating liquid gold silk
 * Cursor reactive · Pure Canvas · Zero dependencies
 */
(function () {
  'use strict';

  // ── boot ──────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // ── state ─────────────────────────────────────────────
  var canvas, ctx, W, H;
  var particles = [];
  var t = 0; // time
  var mouse = { x: -9999, y: -9999, vx: 0, vy: 0, px: -9999, py: -9999 };
  var SCALE = 0.0018;   // noise zoom — smaller = larger swirls
  var SPEED = 0.55;     // particle speed
  var COUNT;            // particle count set in boot

  // ── boot ──────────────────────────────────────────────
  function boot() {
    // Use existing canvas from HTML
    canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    resize();
    spawnParticles();
    bindEvents();
    loop();
  }

  // ── resize ────────────────────────────────────────────
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    COUNT = Math.floor((W * H) / 3800);
    COUNT = Math.min(Math.max(COUNT, 180), 600);
  }

  // ── Perlin noise (classic 2D implementation) ──────────
  var perm = (function () {
    var p = [];
    for (var i = 0; i < 256; i++) p[i] = i;
    for (var i = 255; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = p[i]; p[i] = p[j]; p[j] = tmp;
    }
    var out = [];
    for (var i = 0; i < 512; i++) out[i] = p[i & 255];
    return out;
  })();

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + t * (b - a); }
  function grad(hash, x, y) {
    var h = hash & 3;
    var u = h < 2 ? x : y;
    var v = h < 2 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }
  function noise(x, y) {
    var X = Math.floor(x) & 255;
    var Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    var u = fade(x), v = fade(y);
    var a  = perm[X] + Y;
    var aa = perm[a], ab = perm[a + 1];
    var b  = perm[X + 1] + Y;
    var ba = perm[b], bb = perm[b + 1];
    return lerp(
      lerp(grad(perm[aa], x, y),     grad(perm[ba], x - 1, y),     u),
      lerp(grad(perm[ab], x, y - 1), grad(perm[bb], x - 1, y - 1), u),
      v
    );
  }

  // Flow angle at position (x,y) at time t
  function flowAngle(x, y, time) {
    var n = noise(x * SCALE, y * SCALE + time * 0.12);
    // Mouse distortion — cursor warps nearby flow
    var dx = x - mouse.x;
    var dy = y - mouse.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var influence = Math.max(0, 1 - dist / 280);
    var mouseAngle = Math.atan2(mouse.vy, mouse.vx);
    var base = n * Math.PI * 4;
    return base + influence * mouseAngle * 1.8;
  }

  // ── particles ─────────────────────────────────────────
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function makeParticle(randomLife) {
    // Gold color palette — warm and metallic
    var palette = [
      [212, 160,  20, rnd(0.06, 0.22)],  // deep gold
      [240, 190,  50, rnd(0.08, 0.28)],  // mid gold
      [255, 215,   0, rnd(0.10, 0.35)],  // pure gold
      [255, 240, 140, rnd(0.05, 0.18)],  // bright highlight
      [180, 130,  15, rnd(0.04, 0.15)],  // dark gold
      [255, 255, 200, rnd(0.03, 0.12)],  // white-gold sheen
    ];
    var c = palette[Math.floor(Math.random() * palette.length)];
    var maxLife = Math.floor(rnd(120, 280));
    return {
      x: rnd(0, W),
      y: rnd(0, H),
      vx: 0, vy: 0,
      life: randomLife ? Math.floor(Math.random() * maxLife) : 0,
      maxLife: maxLife,
      r: rnd(0.4, 2.2),      // stroke width
      len: rnd(4, 18),       // trail length
      speed: rnd(0.3, 0.9),
      r_: c[0], g_: c[1], b_: c[2], a_: c[3],
    };
  }

  function spawnParticles() {
    particles = [];
    for (var i = 0; i < COUNT; i++) {
      particles.push(makeParticle(true));
    }
  }

  // ── trail fade layer ───────────────────────────────────
  // Instead of clearRect we paint a semi-transparent black
  // This creates the glowing silk trail effect
  function fadeCanvas() {
    ctx.fillStyle = 'rgba(0,0,0,0.045)';
    ctx.fillRect(0, 0, W, H);
  }

  // ── draw one particle ──────────────────────────────────
  function drawParticle(p) {
    var angle = flowAngle(p.x, p.y, t);
    var spd = p.speed * SPEED;
    var nx = p.vx = Math.cos(angle) * spd;
    var ny = p.vy = Math.sin(angle) * spd;

    // Life envelope for opacity
    var lifeRatio = p.life / p.maxLife;
    var env;
    if (lifeRatio < 0.15) env = lifeRatio / 0.15;
    else if (lifeRatio > 0.85) env = (1 - lifeRatio) / 0.15;
    else env = 1;

    var alpha = p.a_ * env;
    if (alpha < 0.005) { resetParticle(p); return; }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + nx * p.len, p.y + ny * p.len);
    ctx.strokeStyle = 'rgba(' + p.r_ + ',' + p.g_ + ',' + p.b_ + ',' + alpha.toFixed(3) + ')';
    ctx.lineWidth = p.r;
    ctx.lineCap = 'round';

    // Glow on brighter particles
    if (p.a_ > 0.2) {
      ctx.shadowBlur = p.r * 6;
      ctx.shadowColor = 'rgba(255,200,50,' + (alpha * 0.6).toFixed(3) + ')';
    }
    ctx.stroke();
    ctx.restore();

    p.x += nx;
    p.y += ny;
    p.life++;

    // Reset if out of bounds or life expired
    if (p.life >= p.maxLife || p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10) {
      resetParticle(p);
    }
  }

  function resetParticle(p) {
    var fresh = makeParticle(false);
    Object.assign(p, fresh);
    // Respawn at random edge for continuous flow
    var edge = Math.floor(Math.random() * 4);
    if (edge === 0) { p.x = rnd(0, W); p.y = -5; }
    else if (edge === 1) { p.x = W + 5; p.y = rnd(0, H); }
    else if (edge === 2) { p.x = rnd(0, W); p.y = H + 5; }
    else { p.x = -5; p.y = rnd(0, H); }
  }

  // ── main loop ─────────────────────────────────────────
  function loop() {
    requestAnimationFrame(loop);

    fadeCanvas();

    // Update mouse velocity for flow distortion
    mouse.vx += (mouse.x - mouse.px) * 0.3;
    mouse.vy += (mouse.y - mouse.py) * 0.3;
    mouse.vx *= 0.75;
    mouse.vy *= 0.75;
    mouse.px = mouse.x;
    mouse.py = mouse.y;

    for (var i = 0; i < particles.length; i++) {
      drawParticle(particles[i]);
    }

    t += 0.003; // very slow time progression = slow majestic flow
  }

  // ── events ────────────────────────────────────────────
  function bindEvents() {
    window.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    window.addEventListener('mouseleave', function () {
      mouse.x = -9999; mouse.y = -9999;
      mouse.vx = 0; mouse.vy = 0;
    });
    window.addEventListener('resize', function () {
      resize();
      spawnParticles();
    });
    window.addEventListener('touchmove', function (e) {
      var touch = e.touches[0];
      mouse.x = touch.clientX;
      mouse.y = touch.clientY;
    }, { passive: true });
    window.addEventListener('touchend', function () {
      mouse.x = -9999; mouse.y = -9999;
    });
  }

})();
