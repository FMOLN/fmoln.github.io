/**
 * FMOLN — Three.js Luxury Gold Particle System
 * 3D gold fragments + bokeh orbs + dust specks
 * Bloom glow · Depth layers · Cursor reactive in 3D
 */

(function () {

  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js';
  script.onload = init;
  document.head.appendChild(script);

  let scene, camera, renderer, canvas;
  let mouse3D = { x: 0, y: 0 };
  let goldFragments = [], glowOrbs = [], dustPoints;
  let clock;
  let W, H;

  function init() {
    canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    W = window.innerWidth;
    H = window.innerHeight;

    scene = new THREE.Scene();
    clock  = new THREE.Clock();

    camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.set(0, 0, 8);

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';

    buildScene();
    bindEvents();
    animate();
  }

  function goldHex() {
    const p = [0xFFD700, 0xFFEA9E, 0xFFF8E1, 0xF0B432, 0xD4AF37, 0xFFCC44];
    return p[Math.floor(Math.random() * p.length)];
  }

  function clusterPos(spread) {
    spread = spread || 6;
    const r = Math.random();
    const x = r < 0.65 ? (Math.random() - 0.5) * spread * 0.7 : (Math.random() - 0.5) * spread * 1.8;
    const y = r < 0.65 ? (Math.random() - 0.5) * spread * 0.6 : (Math.random() - 0.5) * spread * 1.5;
    const z = (Math.random() - 0.5) * 5;
    return new THREE.Vector3(x, y, z);
  }

  function buildScene() {
    buildLights();
    buildGoldFragments();
    buildGlowOrbs();
    buildDustCloud();
  }

  function buildLights() {
    scene.add(new THREE.AmbientLight(0xFFD700, 0.4));
    const p1 = new THREE.PointLight(0xFFCC44, 2, 20);
    p1.position.set(3, 3, 5); scene.add(p1);
    const p2 = new THREE.PointLight(0xFFF8E1, 1.5, 15);
    p2.position.set(-3, -2, 4); scene.add(p2);
    const p3 = new THREE.PointLight(0xFFAA00, 1, 10);
    p3.position.set(0, 0, 3); scene.add(p3);
  }

  function buildGoldFragments() {
    const count = W < 768 ? 12 : 22;
    for (let i = 0; i < count; i++) {
      const t = Math.floor(Math.random() * 3);
      let geo;
      if (t === 0) geo = new THREE.TetrahedronGeometry(0.08 + Math.random() * 0.18, 0);
      else if (t === 1) geo = new THREE.OctahedronGeometry(0.06 + Math.random() * 0.15, 0);
      else geo = new THREE.IcosahedronGeometry(0.05 + Math.random() * 0.12, 0);

      const mat = new THREE.MeshStandardMaterial({
        color: goldHex(),
        metalness: 0.95,
        roughness: 0.15 + Math.random() * 0.25,
        emissive: new THREE.Color(0xFFAA00),
        emissiveIntensity: 0.3 + Math.random() * 0.4,
        transparent: true,
        opacity: 0.7 + Math.random() * 0.3,
      });

      const mesh = new THREE.Mesh(geo, mat);
      const pos = clusterPos(7);
      mesh.position.copy(pos);
      mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);

      mesh.userData = {
        origPos: pos.clone(),
        rotSpeed: new THREE.Vector3((Math.random()-0.5)*0.008,(Math.random()-0.5)*0.008,(Math.random()-0.5)*0.006),
        floatSpeed: 0.3 + Math.random() * 0.4,
        floatAmp: 0.08 + Math.random() * 0.15,
        floatOffset: Math.random() * Math.PI * 2,
        driftX: (Math.random()-0.5)*0.003,
        driftY: (Math.random()-0.5)*0.002,
        mouseInfluence: 0.4 + Math.random() * 0.6,
      };

      scene.add(mesh);
      goldFragments.push(mesh);
    }
  }

  function buildGlowOrbs() {
    const count = W < 768 ? 10 : 20;
    for (let i = 0; i < count; i++) {
      const size = 0.04 + Math.random() * 0.18;
      const geo = new THREE.SphereGeometry(size, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: goldHex(), transparent: true, opacity: 0.25 + Math.random() * 0.45 });
      const mesh = new THREE.Mesh(geo, mat);
      const pos = clusterPos(8);
      mesh.position.copy(pos);

      const spriteMat = new THREE.SpriteMaterial({
        color: goldHex(), transparent: true,
        opacity: 0.12 + Math.random() * 0.2,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(size * 8, size * 8, 1);
      mesh.add(sprite);

      mesh.userData = {
        origPos: pos.clone(),
        floatSpeed: 0.2 + Math.random() * 0.3,
        floatAmp: 0.12 + Math.random() * 0.2,
        floatOffset: Math.random() * Math.PI * 2,
        pulseSpeed: 0.5 + Math.random() * 1,
        pulseOffset: Math.random() * Math.PI * 2,
        baseOpacity: mat.opacity,
        driftX: (Math.random()-0.5)*0.002,
        driftY: (Math.random()-0.5)*0.002,
        mouseInfluence: 0.2 + Math.random() * 0.4,
        mat, spriteMat,
      };

      scene.add(mesh);
      glowOrbs.push(mesh);
    }
  }

  function buildDustCloud() {
    const count = W < 768 ? 200 : 400;
    const positions = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);
    const goldColors = [
      new THREE.Color(0xFFD700), new THREE.Color(0xFFEA9E),
      new THREE.Color(0xFFF8E1), new THREE.Color(0xF0B432),
    ];

    for (let i = 0; i < count; i++) {
      const pos = clusterPos(9);
      positions[i*3]=pos.x; positions[i*3+1]=pos.y; positions[i*3+2]=pos.z;
      const c = goldColors[Math.floor(Math.random() * goldColors.length)];
      colors[i*3]=c.r; colors[i*3+1]=c.g; colors[i*3+2]=c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.035, vertexColors: true, transparent: true, opacity: 0.65,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });

    dustPoints = new THREE.Points(geo, mat);
    scene.add(dustPoints);
  }

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    goldFragments.forEach(function(mesh) {
      const d = mesh.userData;
      mesh.position.y = d.origPos.y + Math.sin(t * d.floatSpeed + d.floatOffset) * d.floatAmp;
      mesh.position.x = d.origPos.x + Math.cos(t * d.floatSpeed * 0.7 + d.floatOffset) * d.floatAmp * 0.5;
      d.origPos.x += d.driftX; d.origPos.y += d.driftY;
      if (d.origPos.x > 9) d.origPos.x = -9;
      if (d.origPos.x < -9) d.origPos.x = 9;
      if (d.origPos.y > 6) d.origPos.y = -6;
      if (d.origPos.y < -6) d.origPos.y = 6;
      mesh.rotation.x += d.rotSpeed.x;
      mesh.rotation.y += d.rotSpeed.y;
      mesh.rotation.z += d.rotSpeed.z;
      mesh.position.x += mouse3D.x * d.mouseInfluence * 0.015;
      mesh.position.y += mouse3D.y * d.mouseInfluence * 0.015;
    });

    glowOrbs.forEach(function(mesh) {
      const d = mesh.userData;
      mesh.position.y = d.origPos.y + Math.sin(t * d.floatSpeed + d.floatOffset) * d.floatAmp;
      mesh.position.x = d.origPos.x + Math.cos(t * d.floatSpeed * 0.6 + d.floatOffset) * d.floatAmp * 0.6;
      d.origPos.x += d.driftX; d.origPos.y += d.driftY;
      if (d.origPos.x > 10) d.origPos.x = -10;
      if (d.origPos.x < -10) d.origPos.x = 10;
      if (d.origPos.y > 7) d.origPos.y = -7;
      if (d.origPos.y < -7) d.origPos.y = 7;
      const pulse = 0.6 + Math.sin(t * d.pulseSpeed + d.pulseOffset) * 0.4;
      d.mat.opacity = d.baseOpacity * pulse;
      d.spriteMat.opacity = d.baseOpacity * pulse * 0.5;
      mesh.position.x += mouse3D.x * d.mouseInfluence * 0.008;
      mesh.position.y += mouse3D.y * d.mouseInfluence * 0.008;
    });

    if (dustPoints) {
      dustPoints.rotation.y = t * 0.008;
      dustPoints.rotation.x = t * 0.003;
      dustPoints.position.x += (mouse3D.x * 0.12 - dustPoints.position.x) * 0.02;
      dustPoints.position.y += (mouse3D.y * 0.12 - dustPoints.position.y) * 0.02;
    }

    renderer.render(scene, camera);
  }

  function bindEvents() {
    window.addEventListener('mousemove', function(e) {
      mouse3D.x = (e.clientX / W) * 2 - 1;
      mouse3D.y = -(e.clientY / H) * 2 + 1;
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
      mouse3D.y = -(e.touches[0].clientY / H) * 2 + 1;
    }, { passive: true });
  }

})();
