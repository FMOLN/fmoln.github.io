/**
 * FMOLN — Three.js Luxury Gold Particle System v2
 * Fixed: proper WebGL renderer, correct geometry, no line artifacts
 */
(function () {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js';
  script.onload = init;
  document.head.appendChild(script);

  let scene, camera, renderer, canvas;
  let mouse3D = { x: 0, y: 0 };
  let goldFragments = [], glowOrbs = [], dustSystem;
  let clock, W, H;

  function init() {
    canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    W = window.innerWidth;
    H = window.innerHeight;

    scene = new THREE.Scene();
    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.z = 8;

    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // Canvas styling
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';

    addLights();
    addFragments();
    addOrbs();
    addDust();
    bindEvents();
    loop();
  }

  function rnd(min, max) { return min + Math.random() * (max - min); }

  function goldColor() {
    const colors = [0xFFD700, 0xFFEA9E, 0xFFF8E1, 0xF0B432, 0xD4AF37, 0xFFCC44];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Central cluster distribution
  function spawnPos() {
    const clustered = Math.random() < 0.6;
    return new THREE.Vector3(
      clustered ? rnd(-3.5, 3.5) : rnd(-9, 9),
      clustered ? rnd(-2.5, 2.5) : rnd(-6, 6),
      rnd(-4, 2)
    );
  }

  function addLights() {
    scene.add(new THREE.AmbientLight(0xFFD700, 0.5));
    var l1 = new THREE.PointLight(0xFFCC44, 3, 25); l1.position.set(4, 4, 6); scene.add(l1);
    var l2 = new THREE.PointLight(0xFFF8E1, 2, 20); l2.position.set(-4, -3, 5); scene.add(l2);
    var l3 = new THREE.PointLight(0xFFAA00, 1.5, 12); l3.position.set(0, 0, 4); scene.add(l3);
  }

  function addFragments() {
    var count = W < 768 ? 10 : 20;
    for (var i = 0; i < count; i++) {
      var geoType = Math.floor(Math.random() * 3);
      var geo;
      var s = rnd(0.06, 0.22);
      if (geoType === 0)      geo = new THREE.TetrahedronGeometry(s, 0);
      else if (geoType === 1) geo = new THREE.OctahedronGeometry(s, 0);
      else                    geo = new THREE.IcosahedronGeometry(s * 0.8, 0);

      var mat = new THREE.MeshStandardMaterial({
        color: goldColor(),
        metalness: 0.95,
        roughness: rnd(0.1, 0.35),
        emissive: new THREE.Color(0xFFAA00),
        emissiveIntensity: rnd(0.2, 0.6),
        transparent: true,
        opacity: rnd(0.65, 1.0),
      });

      var mesh = new THREE.Mesh(geo, mat);
      var pos = spawnPos();
      mesh.position.copy(pos);
      mesh.rotation.set(rnd(0, Math.PI*2), rnd(0, Math.PI*2), rnd(0, Math.PI*2));

      mesh.userData = {
        home: pos.clone(),
        rx: rnd(-0.007, 0.007), ry: rnd(-0.007, 0.007), rz: rnd(-0.005, 0.005),
        fs: rnd(0.25, 0.55), fa: rnd(0.06, 0.18), fo: rnd(0, Math.PI*2),
        dx: rnd(-0.003, 0.003), dy: rnd(-0.002, 0.002),
        mi: rnd(0.3, 0.8),
      };
      scene.add(mesh);
      goldFragments.push(mesh);
    }
  }

  function addOrbs() {
    var count = W < 768 ? 8 : 18;
    for (var i = 0; i < count; i++) {
      var r = rnd(0.04, 0.2);
      var geo = new THREE.SphereGeometry(r, 16, 16);
      var mat = new THREE.MeshBasicMaterial({
        color: goldColor(), transparent: true,
        opacity: rnd(0.2, 0.5),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      var mesh = new THREE.Mesh(geo, mat);
      var pos = spawnPos();
      mesh.position.copy(pos);

      // Glow halo using sprite
      var halMat = new THREE.SpriteMaterial({
        color: goldColor(), transparent: true,
        opacity: rnd(0.08, 0.22),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      var halo = new THREE.Sprite(halMat);
      halo.scale.setScalar(r * 10);
      mesh.add(halo);

      mesh.userData = {
        home: pos.clone(),
        fs: rnd(0.15, 0.35), fa: rnd(0.1, 0.25), fo: rnd(0, Math.PI*2),
        ps: rnd(0.4, 1.2), po: rnd(0, Math.PI*2),
        base: mat.opacity,
        dx: rnd(-0.002, 0.002), dy: rnd(-0.002, 0.002),
        mi: rnd(0.15, 0.4),
        mat: mat, halMat: halMat,
      };
      scene.add(mesh);
      glowOrbs.push(mesh);
    }
  }

  function addDust() {
    var count = W < 768 ? 180 : 380;
    var pos = new Float32Array(count * 3);
    var col = new Float32Array(count * 3);
    var goldCols = [
      new THREE.Color(0xFFD700), new THREE.Color(0xFFEA9E),
      new THREE.Color(0xFFF8E1), new THREE.Color(0xF0B432),
    ];
    for (var i = 0; i < count; i++) {
      var p = spawnPos();
      pos[i*3] = p.x; pos[i*3+1] = p.y; pos[i*3+2] = p.z;
      var c = goldCols[Math.floor(Math.random() * goldCols.length)];
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

    // Use Points with proper material - no lines
    var mat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    dustSystem = new THREE.Points(geo, mat);
    scene.add(dustSystem);
  }

  function loop() {
    requestAnimationFrame(loop);
    var t = clock.getElapsedTime();

    // Animate fragments
    for (var i = 0; i < goldFragments.length; i++) {
      var m = goldFragments[i], d = m.userData;
      m.position.x = d.home.x + Math.cos(t * d.fs * 0.7 + d.fo) * d.fa * 0.5 + mouse3D.x * d.mi * 0.02;
      m.position.y = d.home.y + Math.sin(t * d.fs + d.fo) * d.fa + mouse3D.y * d.mi * 0.02;
      m.rotation.x += d.rx; m.rotation.y += d.ry; m.rotation.z += d.rz;
      d.home.x += d.dx; d.home.y += d.dy;
      if (d.home.x > 9) d.home.x = -9; if (d.home.x < -9) d.home.x = 9;
      if (d.home.y > 7) d.home.y = -7; if (d.home.y < -7) d.home.y = 7;
    }

    // Animate orbs
    for (var j = 0; j < glowOrbs.length; j++) {
      var o = glowOrbs[j], od = o.userData;
      o.position.x = od.home.x + Math.cos(t * od.fs * 0.6 + od.fo) * od.fa * 0.6 + mouse3D.x * od.mi * 0.01;
      o.position.y = od.home.y + Math.sin(t * od.fs + od.fo) * od.fa + mouse3D.y * od.mi * 0.01;
      od.home.x += od.dx; od.home.y += od.dy;
      if (od.home.x > 10) od.home.x = -10; if (od.home.x < -10) od.home.x = 10;
      if (od.home.y > 8) od.home.y = -8; if (od.home.y < -8) od.home.y = 8;
      var pulse = 0.55 + Math.sin(t * od.ps + od.po) * 0.45;
      od.mat.opacity = od.base * pulse;
      od.halMat.opacity = od.base * pulse * 0.45;
    }

    // Dust slow drift
    if (dustSystem) {
      dustSystem.rotation.y = t * 0.006;
      dustSystem.rotation.x = t * 0.002;
      dustSystem.position.x += (mouse3D.x * 0.15 - dustSystem.position.x) * 0.015;
      dustSystem.position.y += (mouse3D.y * 0.15 - dustSystem.position.y) * 0.015;
    }

    renderer.render(scene, camera);
  }

  function bindEvents() {
    window.addEventListener('mousemove', function(e) {
      mouse3D.x = (e.clientX / W) * 2 - 1;
      mouse3D.y = -((e.clientY / H) * 2 - 1);
    });
    window.addEventListener('mouseleave', function() { mouse3D.x = 0; mouse3D.y = 0; });
    window.addEventListener('resize', function() {
      W = window.innerWidth; H = window.innerHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    });
    window.addEventListener('touchmove', function(e) {
      mouse3D.x = (e.touches[0].clientX / W) * 2 - 1;
      mouse3D.y = -((e.touches[0].clientY / H) * 2 - 1);
    }, { passive: true });
  }
})();
