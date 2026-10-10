/* AURA's original WebGL scenes. Architecture is modeled; our photographs supply
   the distant environment. No reference-site models or textures are used. */
import { initAtelierUI, createAtelier } from '/atelier.js';
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
async function startImmersive() {
  const hero = document.querySelector('.hero');
  if (!hero || reduced.matches) return;
  const THREE = await import('/vendor/three.module.js');
  if (reduced.matches) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    document.documentElement.dataset.immersive = 'fallback';
    return;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.25 : 1.6));
  const canvas = renderer.domElement;
  canvas.className = 'immersive-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const camera = new THREE.PerspectiveCamera(42, 1, .06, 120);
  const loader = new THREE.TextureLoader();
  const resources = new Set();
  const textureCache = new Map();
  function texture(url) {
    if (!textureCache.has(url)) textureCache.set(url, loader.loadAsync(url).then(map => {
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      if (destroyed) map.dispose();
      else resources.add(map);
      return map;
    }));
    return textureCache.get(url);
  }
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;
  const fragmentShader = `
    uniform sampler2D dayMap;
    uniform sampler2D nightMap;
    uniform float night;
    uniform float time;
    uniform float water;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      float pool = (1.0-smoothstep(.21,.27,uv.y))
        * smoothstep(.06,.22,uv.x) * (1.0-smoothstep(.78,.94,uv.x)) * water;
      uv.x += sin(uv.y*185.0 + time*.8) * .0014 * pool;
      uv.y += sin(uv.x*130.0 - time*.6) * .0008 * pool;
      vec4 color = mix(texture2D(dayMap,uv),texture2D(nightMap,uv),night);
      color.rgb += sin(uv.y*300.0 + time) * .004 * pool;
      gl_FragColor = color;
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;
  // Deterministic limestone pores and horizontal grain, generated locally.
  const stoneCanvas = document.createElement('canvas');
  stoneCanvas.width = stoneCanvas.height = 256;
  const ctx = stoneCanvas.getContext('2d');
  const pixels = ctx.createImageData(256, 256);
  let seed = 82;
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const grain = (seed / 4294967296 - .5) * 18 + Math.sin(y * .23) * 3;
    const i = (y * 256 + x) * 4;
    pixels.data.set([219 + grain, 207 + grain, 184 + grain, 255], i);
  }
  ctx.putImageData(pixels, 0, 0);
  const stone = new THREE.CanvasTexture(stoneCanvas);
  stone.colorSpace = THREE.SRGBColorSpace;
  stone.wrapS = stone.wrapT = THREE.RepeatWrapping;
  stone.repeat.set(2, 3);
  resources.add(stone);
  const configurations = [
    { name: 'courtyard', host: hero, url: '/assets/hero-day.webp', nightUrl: '/assets/hero-night.webp', trigger: 'aura-hero', arch: true, water: true },
    { name: 'garden', host: document.querySelector('.concept-portal'), url: '/assets/garden-walk.webp', trigger: 'aura-concept', arch: true, water: false },
    { name: 'atelier', host: document.querySelector('.atelier-stage'), trigger: 'aura-atelier', kind: 'model' },
    { name: 'architecture', host: document.querySelector('.architecture-gate .photo'), url: '/assets/facade.webp', trigger: 'aura-architecture', arch: true, water: false },
    { name: 'rooftop', host: document.querySelector('.footer'), url: '/assets/rooftop.webp', arch: false }
  ].filter(config => config.host);
  let active = null;
  let animation = 0;
  let running = false;
  let destroyed = false;
  let lost = false;
  let lastTime = 0;
  let width = 0, height = 0;
  let frames = 0;
  const pointer = new THREE.Vector2();
  const smoothPointer = new THREE.Vector2();
  const target = new THREE.Vector3();
  const visible = new Set();
  const stoneDay = new THREE.Color('#ffffff');
  const stoneNight = new THREE.Color('#455168');
  function portal() {
    const shape = new THREE.Shape();
    shape.moveTo(-1.45, -2.8);
    shape.lineTo(-1.45, 2);
    shape.lineTo(1.45, 2);
    shape.lineTo(1.45, -2.8);
    shape.lineTo(1, -2.8);
    shape.lineTo(1, .42);
    shape.bezierCurveTo(1, 1.62, -1, 1.62, -1, .42);
    shape.lineTo(-1, -2.8);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: .34, bevelEnabled: true, bevelSize: .025, bevelThickness: .025, bevelSegments: 2, curveSegments: 36 });
    const material = new THREE.MeshStandardMaterial({ map: stone, roughness: .94, metalness: 0 });
    resources.add(geometry); resources.add(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = 6;
    return mesh;
  }
  async function build(config) {
    if (config.kind === 'model') {
      config.controller = createAtelier(THREE, resources, stone, config.host.closest('.atelier'));
      config.scene = config.controller.scene; config.progress = 0;
      config.host.classList.add('immersive-host'); schedule(); return;
    }
    const [day, night, foliage] = await Promise.all([
      texture(config.url), texture(config.nightUrl || config.url), texture('/assets/bougainvillea.webp')
    ]);
    if (destroyed) return;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#fff4df', '#6b736c', 2.1));
    const sun = new THREE.DirectionalLight('#fff2dc', 2.5);
    sun.position.set(-4, 6, 8); scene.add(sun);
    const uniforms = { dayMap: { value: day }, nightMap: { value: night }, night: { value: 0 }, time: { value: 0 }, water: { value: config.water ? 1 : 0 } };
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
    const geometry = new THREE.PlaneGeometry(1, 1, 90, 60);
    const photograph = new THREE.Mesh(geometry, material);
    scene.add(photograph);
    resources.add(geometry); resources.add(material);
    const arch = config.arch ? portal() : null;
    if (arch) scene.add(arch);
    const leaves = [];
    for (const side of [-1, 1]) {
      const leafGeometry = new THREE.PlaneGeometry(1, 1, 8, 12);
      const leafMaterial = new THREE.ShaderMaterial({
        uniforms: { map: { value: foliage }, brightness: { value: 1 } },
        vertexShader,
        fragmentShader: `
          uniform sampler2D map;
          uniform float brightness;
          varying vec2 vUv;
          void main() {
            vec4 color = texture2D(map,vUv);
            float edge = smoothstep(0.0,.16,vUv.x) * (1.0-smoothstep(.84,1.0,vUv.x))
              * smoothstep(0.0,.1,vUv.y) * (1.0-smoothstep(.85,1.0,vUv.y));
            color.a *= edge;
            if(color.a < .01) discard;
            gl_FragColor = vec4(color.rgb * brightness,color.a);
            #include <colorspace_fragment>
          }`,
        transparent: true, depthWrite: false, side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(leafGeometry, leafMaterial);
      mesh.userData.side = side;
      mesh.position.z = side === 1 ? 5 : 4.4;
      scene.add(mesh); leaves.push(mesh);
      resources.add(leafGeometry); resources.add(leafMaterial);
    }
    config.scene = scene; config.uniforms = uniforms; config.photo = photograph;
    config.arch = arch; config.leaves = leaves; config.sun = sun;
    config.aspect = day.image.width / day.image.height;
    config.progress = 0;
    config.host.classList.add('immersive-host');
    schedule();
  }
  function resize(config, w, h) {
    width = w; height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (config.kind === 'model') return;
    const fullHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 9;
    const photoHeight = Math.max(fullHeight, fullHeight * camera.aspect / config.aspect) * 1.13;
    const photoWidth = photoHeight * config.aspect;
    const positions = config.photo.geometry.attributes.position;
    const uv = config.photo.geometry.attributes.uv;
    for (let i = 0; i < positions.count; i++) {
      const u = uv.getX(i), v = uv.getY(i);
      // Perspective-correct relief: foreground garden projects closer than sky.
      const ground = Math.pow(Math.max(0, 1 - v / .62), 1.25);
      const depth = ground * 1.65 - THREE.MathUtils.smoothstep(v, .55, .82) * .7;
      const correction = (9 - depth) / 9;
      positions.setXYZ(i, (u - .5) * photoWidth * correction, (v - .5) * photoHeight * correction, depth);
    }
    positions.needsUpdate = true;
    config.photo.geometry.computeBoundingSphere();
    if (config.arch) config.arch.scale.x = fullHeight / 9 * 3 * camera.aspect * .48;
    for (const leaf of config.leaves) {
      const distance = 9 - leaf.position.z;
      const viewHeight = fullHeight * distance / 9;
      const viewWidth = viewHeight * camera.aspect;
      leaf.scale.set(viewHeight * .52, viewHeight * .85, 1);
      leaf.position.x = leaf.userData.side * viewWidth * .55;
      leaf.position.y = -viewHeight * .35;
      leaf.userData.baseY = leaf.position.y;
      leaf.rotation.z = leaf.userData.side * -.18;
      leaf.visible = camera.aspect > .75 || leaf.userData.side === 1;
    }
  }
  function progressFor(config) {
    const trigger = window.ScrollTrigger?.getById(config.trigger);
    if (trigger) return trigger.progress;
    const rect = config.host.getBoundingClientRect();
    return THREE.MathUtils.clamp((innerHeight - rect.top) / (innerHeight + rect.height), 0, 1);
  }
  function chooseScene() {
    let best = null, area = 0;
    for (const config of visible) {
      if (!config.scene) continue;
      const rect = config.host.getBoundingClientRect();
      const visibleHeight = Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top));
      if (visibleHeight * rect.width > area) { area = visibleHeight * rect.width; best = config; }
    }
    return best;
  }
  function frame(time) {
    running = false;
    if (destroyed || lost || document.hidden || reduced.matches) return;
    const config = chooseScene();
    if (!config) return;
    const delta = Math.min((time - lastTime) / 1000 || .016, .05);
    lastTime = time;
    if (active !== config) {
      active?.host.classList.remove('immersive-live');
      active = config; width = 0;
      if (config.kind === 'model') renderer.shadowMap.needsUpdate = true;
      config.host.prepend(canvas);
    }
    const rect = config.host.getBoundingClientRect();
    const w = Math.round(rect.width), h = Math.round(rect.height);
    if (!w || !h) return;
    if (width !== w || height !== h) resize(config, w, h);
    const ease = 1 - Math.exp(-delta * 5);
    config.progress += (progressFor(config) - config.progress) * ease;
    smoothPointer.lerp(pointer, ease * .65);
    const p = config.progress;
    if (config.kind === 'model') {
      if (config.controller.update(camera, p, time, camera.aspect, delta)) renderer.shadowMap.needsUpdate = true;
    }
    else {
    const arrival = document.documentElement.dataset.motionReady === 'true' ? 0 : .65;
    const travel = config.name === 'rooftop' ? 1.2 : 3.65;
    camera.position.set(smoothPointer.x * .24 + Math.sin(p * Math.PI) * .12, smoothPointer.y * -.12 + p * .12, 9 - p * travel + arrival);
    target.set(smoothPointer.x * -.12, -.1 - p * .28, 0);
    camera.lookAt(target);
    const night = config.name === 'courtyard' && hero.classList.contains('is-night') ? 1 : 0;
    config.uniforms.night.value += (night - config.uniforms.night.value) * (1 - Math.exp(-delta * 2));
    config.uniforms.time.value = time / 1000;
    if (config.arch) {
      config.arch.material.color.copy(stoneDay).lerp(stoneNight, config.uniforms.night.value);
      config.arch.visible = camera.position.z > 6.12;
    }
    config.sun.intensity = 2.5 - config.uniforms.night.value * 1.9;
    for (const leaf of config.leaves) {
      leaf.rotation.z = leaf.userData.side * -.18 + Math.sin(time * .0004 + leaf.userData.side) * .022;
      leaf.rotation.y = Math.sin(time * .0003) * .035;
      leaf.position.y = leaf.userData.baseY + Math.sin(time * .0005) * .025;
      leaf.material.uniforms.brightness.value = 1 - config.uniforms.night.value * .57;
    }
    }
    renderer.render(config.scene, camera);
    config.host.classList.add('immersive-live');
    document.documentElement.dataset.immersive = 'ready';
    frames++;
    schedule();
  }
  function schedule() {
    if (running || destroyed || lost || document.hidden || reduced.matches) return;
    running = true; animation = requestAnimationFrame(frame);
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const config = configurations.find(item => item.host === entry.target);
      if (entry.isIntersecting) {
        visible.add(config);
        if (!config.loading) config.loading = build(config).catch(() => { config.failed = true; });
      } else visible.delete(config);
    }
    schedule();
  }, { rootMargin: '100px' });
  configurations.forEach(config => observer.observe(config.host));
  const onPointer = event => {
    if (event.pointerType !== 'mouse') return;
    pointer.set((event.clientX / innerWidth - .5) * 2, (event.clientY / innerHeight - .5) * 2);
    schedule();
  };
  const resetPointer = () => pointer.set(0, 0);
  const visibility = () => { if (!document.hidden) { lastTime = 0; schedule(); } };
  document.addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('pointerleave', resetPointer);
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); lost = true; cancelAnimationFrame(animation); running = false;
    active?.host.classList.remove('immersive-live');
    document.documentElement.dataset.immersive = 'fallback';
  });
  canvas.addEventListener('webglcontextrestored', () => { lost = false; renderer.shadowMap.needsUpdate = true; schedule(); });
  // A read-only snapshot supports runtime QA without coupling tests to the shader.
  window.auraImmersive = { getState: () => ({ scene: active?.name, camera: camera.position.toArray(), night: active?.uniforms?.night.value, atelier: active?.controller?.getState(), frames, running, lost, triangles: renderer.info.render.triangles, drawCalls: renderer.info.render.calls, pixelRatio: renderer.getPixelRatio(), textures: renderer.info.memory.textures }) };
  function dispose() {
    if (!reduced.matches) return;
    destroyed = true; cancelAnimationFrame(animation); observer.disconnect();
    configurations.forEach(config => { config.controller?.dispose(); config.host.classList.remove('immersive-live', 'immersive-host'); });
    canvas.remove(); resources.forEach(resource => resource.dispose()); renderer.dispose();
    document.removeEventListener('pointermove', onPointer);
    document.removeEventListener('pointerleave', resetPointer);
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule);
    reduced.removeEventListener('change', dispose);
    document.documentElement.dataset.immersive = 'reduced';
  }
  reduced.addEventListener('change', dispose);
}
function init() { initAtelierUI(); startImmersive().catch(() => { document.documentElement.dataset.immersive = 'fallback'; }); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
