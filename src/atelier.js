/* Original AURA architectural miniature and its progressive controls. */
const views = {
  gardens: { title: 'Connected by nature', copy: 'Olive trees, flowering paths and private garden terraces. A quieter way to find your way home.', image: 'garden-suite', angle: .7, target: [-1, 1.3, .4] },
  pool: { title: 'The heart of AURA', copy: 'A courtyard for unhurried mornings. Water, warm stone and places to pause in the shade.', image: 'pool-detail', angle: .05, target: [0, 1.3, .6] },
  rooftop: { title: 'Above the everyday', copy: 'A private rooftop, an open horizon. Your own space to watch the Mediterranean change colour.', image: 'rooftop', angle: -.65, target: [1, 1.8, -.2] }
};
export function initAtelierUI() {
  const root = document.querySelector('.atelier');
  if (!root || root.dataset.controlsReady) return;
  root.dataset.controlsReady = 'true';
  root.querySelector('.atelier-stage').setAttribute('tabindex', '-1');
  root.querySelector('.atelier-stage').setAttribute('aria-label', 'AURA architectural study');
  root.dataset.view = 'pool'; root.dataset.hour = '10';
  function select(view) {
    const item = views[view]; if (!item) return;
    root.dataset.view = view;
    root.querySelectorAll('[data-atelier-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.atelierView === view)));
    root.querySelector('.atelier-focus h3').textContent = item.title;
    root.querySelector('.atelier-description').textContent = item.copy;
    root.querySelector('.atelier-fallback').src = '/assets/' + item.image + '.webp';
    root.dispatchEvent(new CustomEvent('aura:atelier-view', { detail: view }));
  }
  root.addEventListener('click', event => {
    const button = event.target.closest('[data-atelier-view]');
    if (button) select(button.dataset.atelierView);
  });
  root.addEventListener('aura:atelier-pick', event => select(event.detail));
  const input = root.querySelector('#atelier-hour');
  input.addEventListener('input', () => {
    const hour = Number(input.value);
    root.dataset.hour = String(hour);
    const label = hour < 12 ? 'Morning light' : hour < 17 ? 'Afternoon light' : hour < 20 ? 'Golden hour' : 'After dark';
    root.querySelector('#atelier-time').textContent = `${String(hour).padStart(2, '0')}:00 · ${label}`;
    input.setAttribute('aria-valuetext', `${hour}:00, ${label}`);
    root.classList.toggle('atelier-evening', hour >= 20);
    if (hour >= 20) root.setAttribute('data-light', ''); else root.removeAttribute('data-light');
    window.updateHeader?.();
  });
  select('pool');
}

export function createAtelier(THREE, resources, stone, root) {
  const stage = root.querySelector('.atelier-stage');
  stage.setAttribute('tabindex', '0');
  stage.setAttribute('aria-label', 'AURA architectural miniature. Drag horizontally or use the arrow keys to rotate. Choose a view below.');
  const scene = new THREE.Scene();
  const model = new THREE.Group(); scene.add(model);
  const hemisphere = new THREE.HemisphereLight('#fff5e4', '#a2aa91', 2.2); scene.add(hemisphere);
  const sun = new THREE.DirectionalLight('#fff0d2', 3); sun.position.set(-8, 15, 9); scene.add(sun);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: .5, far: 55 });
  sun.shadow.bias = -.0005; sun.shadow.normalBias = .04;
  const fill = new THREE.DirectionalLight('#c8e0f0', .9); fill.position.set(10, 6, -8); scene.add(fill);
  function keep(resource) { resources.add(resource); return resource; }
  const material = (color, extra = {}) => keep(new THREE.MeshStandardMaterial({ color, roughness: .83, ...extra }));
  const limestone = material('#f1e9d8', { map: stone });
  const plaster = material('#e9e3d3');
  const bronze = material('#75654f', { roughness: .6, metalness: .35 });
  const glass = material('#436266', { roughness: .32, metalness: .4, emissive: '#f5b974', emissiveIntensity: 0 });
  const wood = material('#a88963');
  const linen = material('#f2eddf');
  const olive = material('#728263');
  const sage = material('#8b987b');
  const flowers = material('#a34878');
  const soil = material('#b4b19b');
  const base = material('#d7d3c0');
  const box = keep(new THREE.BoxGeometry(1, 1, 1));
  const cylinder = keep(new THREE.CylinderGeometry(.5, .5, 1, 64));
  const sphere = keep(new THREE.SphereGeometry(.5, 12, 8));
  const batches = new Map();
  const helper = new THREE.Object3D();
  // Hundreds of model details share a small number of instanced draw calls.
  function place(geometry, mat, x, y, z, sx, sy, sz, ry = 0, rz = 0) {
    const key = geometry.uuid + mat.uuid;
    if (!batches.has(key)) batches.set(key, { geometry, material: mat, transforms: [] });
    helper.position.set(x, y, z); helper.scale.set(sx, sy, sz); helper.rotation.set(0, ry, rz); helper.updateMatrix();
    batches.get(key).transforms.push(helper.matrix.clone());
  }
  function roundedSlab(w, d, radius, thickness) {
    const shape = new THREE.Shape(); const x = -w / 2, y = -d / 2;
    shape.moveTo(x + radius, y);
    shape.lineTo(x + w - radius, y); shape.quadraticCurveTo(x + w, y, x + w, y + radius);
    shape.lineTo(x + w, y + d - radius); shape.quadraticCurveTo(x + w, y + d, x + w - radius, y + d);
    shape.lineTo(x + radius, y + d); shape.quadraticCurveTo(x, y + d, x, y + d - radius);
    shape.lineTo(x, y + radius); shape.quadraticCurveTo(x, y, x + radius, y);
    const geometry = keep(new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 16 }));
    geometry.rotateX(-Math.PI / 2); return geometry;
  }
  const wingFloor = roundedSlab(3.9, 7.2, .65, .18);
  const backFloor = roundedSlab(3.3, 3.1, .5, .18);
  const poolEdge = roundedSlab(3.4, 6.4, .35, .12);
  place(cylinder, base, 0, -.2, 0, 18.4, .45, 14);
  place(cylinder, limestone, 0, .04, 0, 18.2, .08, 13.8);
  place(poolEdge, limestone, 0, .13, 1.55, 1, 1, 1);
  place(cylinder, soil, -6.9, .13, 0, 1.45, .12, 7);
  place(cylinder, soil, 6.9, .13, 0, 1.45, .12, 7);
  function wing(x) {
    for (let floor = 0; floor < 3; floor++) {
      const y = .3 + floor * 1.65;
      place(wingFloor, limestone, x, y, -.8, 1, 1, 1);
      place(box, plaster, x, y + .76, -1.1, 3.42, 1.35, 5.9);
      // Recessed bronze glazing, pillars and rounded balcony slabs.
      for (const z of [2.0, -4.12]) {
        place(box, glass, x, y + .77, z, 3.05, 1.08, .045);
        for (const offset of [-1.45, -.48, .48, 1.45]) place(box, bronze, x + offset, y + .77, z + .035, .035, 1.15, .035);
      }
      for (const side of [-1, 1]) {
        place(box, limestone, x + side * 1.68, y + .76, 2.56, .2, 1.42, .22);
        place(box, bronze, x + side * 1.68, y + .5, 2.7, .025, .55, .025);
      }
      place(box, bronze, x, y + .72, 2.73, 3.55, .025, .035);
      place(box, linen, x + .5, y + .26, 2.35, .85, .28, .42);
      place(cylinder, wood, x - .55, y + .29, 2.3, .38, .35, .38);
    }
    place(wingFloor, limestone, x, 5.3, -.8, 1, 1, 1);
    for (const side of [-1, 1]) for (const z of [-3.4, 1.8]) place(box, wood, x + side * 1.52, 5.92, z, .08, 1.1, .08);
    for (let i = 0; i < 12; i++) place(box, wood, x, 6.45, -3.4 + i * .47, 3.3, .08, .085);
    place(box, linen, x, 5.52, .6, 1.3, .22, .65);
  }
  wing(-4.8); wing(4.8);
  for (let floor = 0; floor < 2; floor++) {
    const y = .3 + floor * 1.65;
    place(backFloor, limestone, 0, y, -3.8, 1, 1, 1);
    place(box, plaster, 0, y + .76, -4, 2.85, 1.35, 2.5);
    place(box, glass, 0, y + .72, -2.71, 2.45, 1.07, .035);
    for (const x of [-1.13, 0, 1.13]) place(box, bronze, x, y + .73, -2.67, .035, 1.12, .04);
  }
  place(backFloor, limestone, 0, 3.6, -3.8, 1, 1, 1);
  for (let i = 0; i < 4; i++) place(box, limestone, 0, .2 + i * .085, -1.7 - i * .2, 2.2, .1, .3);
  // Poolside furniture and garden planting.
  for (const x of [-2.4, 2.4]) for (const z of [.6, 2.5, 4.25]) {
    place(box, wood, x, .28, z, .75, .14, 1.2);
    place(box, linen, x, .4, z, .69, .13, 1.05);
    place(box, linen, x, .56, z - .44, .68, .35, .17);
  }
  function oliveTree(x, z, h) {
    place(cylinder, wood, x, h / 2 + .16, z, .14, h, .14, 0, -.1);
    for (let i = 0; i < 5; i++) {
      const theta = i * Math.PI * 2 / 5;
      place(sphere, i % 2 ? olive : sage, x + Math.cos(theta) * .45, h + .25 + (i % 2) * .24, z + Math.sin(theta) * .4, 1.2, .86, 1.1);
    }
  }
  for (const x of [-7, 7]) for (const z of [-3, 0, 3]) oliveTree(x, z, 1.85 + (z + 3) * .08);
  for (const side of [-1, 1]) {
    const x = side * 2.65, z = -1.5;
    place(cylinder, wood, x, 1.6, z, .13, 2.9, .13, 0, side * -.1);
    for (let i = 0; i < 7; i++) {
      const theta = i * Math.PI * 2 / 7;
      place(sphere, olive, x + Math.cos(theta) * .57, 3.08, z + Math.sin(theta) * .57, 1.8, .12, .36, -theta, -.18);
    }
  }
  for (const x of [-6.4, -3.3, 3.3, 6.4]) for (const z of [2.75, -3.6]) {
    place(cylinder, limestone, x, .36, z, .45, .4, .45);
    place(sphere, olive, x, .67, z, .65, .46, .65);
    place(sphere, flowers, x + .13, .79, z + .13, .42, .26, .4);
  }
  for (const batch of batches.values()) {
    const mesh = keep(new THREE.InstancedMesh(batch.geometry, batch.material, batch.transforms.length));
    batch.transforms.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
    mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
    mesh.castShadow = true; mesh.receiveShadow = true; model.add(mesh);
  }
  // Original water shader: actual surface geometry, with subtle animated caustics.
  const waterUniforms = { time: { value: 0 }, night: { value: 0 } };
  const water = keep(new THREE.ShaderMaterial({ uniforms: waterUniforms,
    vertexShader: `uniform float time; varying vec2 vUv; void main(){vUv=uv;vec3 p=position;p.z+=sin(p.x*4.0+time)*cos(p.y*5.0-time*.6)*.018;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
    fragmentShader: `uniform float time; uniform float night; varying vec2 vUv; void main(){vec2 flow=vUv*vec2(15.0,25.0);float a=sin(flow.x*2.4+sin(flow.y*1.8-time*.45));float b=cos(flow.y*2.0+sin(flow.x*2.1+time*.3));float caustic=pow(1.0-abs(a+b)*.5,14.0);vec3 color=mix(vec3(.27,.60,.62),vec3(.06,.27,.38),night)+caustic*.11;gl_FragColor=vec4(color,1.0);#include <colorspace_fragment>}`.replace('#include', '\n#include')
  }));
  const pool = new THREE.Mesh(keep(new THREE.PlaneGeometry(3.06, 6.04, 24, 40)), water);
  pool.rotation.x = -Math.PI / 2; pool.position.set(0, .275, 1.55); model.add(pool);
  const hotspotMaterial = keep(new THREE.MeshBasicMaterial({ color: '#e5d4ae' }));
  const hotspotGeometry = keep(new THREE.SphereGeometry(.13, 16, 12));
  const hotspots = Object.entries(views).map(([name, view]) => {
    const mesh = new THREE.Mesh(hotspotGeometry, hotspotMaterial);
    const position = name === 'gardens' ? [-7, 3.6, 1] : name === 'pool' ? [0, 1, 2] : [4.8, 7, -.8];
    mesh.position.set(...position); mesh.userData.view = name; model.add(mesh); return mesh;
  });
  let angle = .38, targetAngle = .38, hour = Number(root.dataset.hour), selected = root.dataset.view;
  let interacted = false, dragging = null, lastCamera = null, lastHour = null;
  const look = new THREE.Vector3(0, 1.4, 0);
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const dayColour = new THREE.Color('#ffffff'), nightColour = new THREE.Color('#7d91a8');
  function select(event) { selected = event.detail; targetAngle = views[selected].angle; interacted = true; }
  root.addEventListener('aura:atelier-view', select);
  const onDown = event => {
    if (event.button && event.button !== 0) return;
    dragging = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, moved: false };
  };
  const onMove = event => {
    if (!dragging || dragging.id !== event.pointerId) return;
    const dx = event.clientX - dragging.x, dy = event.clientY - dragging.y;
    if (!dragging.moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      dragging.moved = true; stage.setPointerCapture(event.pointerId); stage.classList.add('is-dragging');
    }
    if (dragging.moved) { targetAngle -= (event.clientX - dragging.lastX) * .006; interacted = true; }
    dragging.lastX = event.clientX;
  };
  const onUp = event => {
    if (!dragging || dragging.id !== event.pointerId) return;
    if (!dragging.moved && lastCamera && event.type !== 'pointercancel') {
      const rect = stage.getBoundingClientRect();
      mouse.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      ray.setFromCamera(mouse, lastCamera);
      const hit = ray.intersectObjects(model.children, false)[0];
      if (hit?.object.userData.view) root.dispatchEvent(new CustomEvent('aura:atelier-pick', { detail: hit.object.userData.view }));
    }
    dragging = null; stage.classList.remove('is-dragging');
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
  };
  const rotate = direction => { targetAngle += direction * .4; interacted = true; };
  const onKey = event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); rotate(event.key === 'ArrowLeft' ? -1 : 1); }
  };
  const onClick = event => {
    const button = event.target.closest('[data-atelier-rotate]'); if (!button) return;
    if (button.dataset.atelierRotate === 'reset') { root.dispatchEvent(new CustomEvent('aura:atelier-pick', { detail: 'pool' })); targetAngle = .38; selected = 'pool'; interacted = false; }
    else rotate(Number(button.dataset.atelierRotate));
  };
  stage.addEventListener('pointerdown', onDown); stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp); stage.addEventListener('pointercancel', onUp); stage.addEventListener('keydown', onKey);
  root.addEventListener('click', onClick);
  return {
    scene,
    update(camera, progress, time, aspect, delta) {
      hour = Number(root.dataset.hour);
      const night = THREE.MathUtils.smoothstep(hour, 18.5, 21);
      if (!interacted) targetAngle = .55 - progress * .45;
      const ease = 1 - Math.exp(-delta * 5); angle += (targetAngle - angle) * ease;
      const centre = interacted ? views[selected].target : [0, 1.4, 0];
      look.lerp(new THREE.Vector3(...centre), ease);
      const distance = (interacted ? 22.5 : 22.5 - progress * 1.7) * Math.max(1, 1.25 / aspect);
      camera.position.set(Math.sin(angle) * distance, 12 * Math.max(1, 1.25 / aspect), Math.cos(angle) * distance);
      camera.lookAt(look); lastCamera = camera;
      const solar = (hour - 7) / 14 * Math.PI;
      sun.position.set(-Math.cos(solar) * 13, Math.max(2, Math.sin(solar) * 16), 8);
      sun.intensity = 3 - night * 2.6;
      sun.color.set(hour >= 17 && hour < 20 ? '#ffb96c' : '#fff0d2');
      hemisphere.intensity = 2.2 - night * 1.25;
      limestone.color.copy(dayColour).lerp(nightColour, night);
      glass.emissiveIntensity = night * .8;
      waterUniforms.time.value = time / 1000; waterUniforms.night.value = night;
      for (const hotspot of hotspots) hotspot.scale.setScalar(hotspot.userData.view === selected ? 1.3 + Math.sin(time * .002) * .08 : .85);
      const shadowDirty = hour !== lastHour; lastHour = hour;
      return shadowDirty;
    },
    getState: () => ({ angle, hour, view: selected, dragging: !!dragging?.moved, instances: [...batches.values()].reduce((sum, batch) => sum + batch.transforms.length, 0) }),
    dispose() {
      stage.setAttribute('tabindex', '-1'); stage.setAttribute('aria-label', 'AURA architectural study');
      sun.shadow.dispose();
      root.removeEventListener('aura:atelier-view', select); root.removeEventListener('click', onClick);
      stage.removeEventListener('pointerdown', onDown); stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp); stage.removeEventListener('pointercancel', onUp); stage.removeEventListener('keydown', onKey);
    }
  };
}
