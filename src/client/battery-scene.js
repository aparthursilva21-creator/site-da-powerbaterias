import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const easing = (value, start, end) => {
  const progress = THREE.MathUtils.clamp((value - start) / (end - start), 0, 1);
  return progress * progress * (3 - 2 * progress);
};

export function setupBattery(destination, section, onPosition, onFailure) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2', { antialias: true, powerPreference: 'low-power' });
  if (!context) throw new Error('WebGL 2 indisponível');
  const renderer = new THREE.WebGLRenderer({ canvas, context });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#101410');
  const camera = new THREE.OrthographicCamera(-3, 3, 2, -2, .1, 40);
  camera.position.set(5.6, 3.7, 6.5);
  camera.lookAt(0, .35, 0);
  scene.add(new THREE.HemisphereLight('#edfff2', '#151914', 1.3));
  const key = new THREE.DirectionalLight('#f6fcf3', 2.4);
  key.position.set(-2, 8, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#91d16c', 2.3);
  rim.position.set(3, 3, -5);
  scene.add(rim);
  const materials = {
    polymer: new THREE.MeshStandardMaterial({ color: '#161c19', roughness: .5, metalness: .06 }),
    casing: new THREE.MeshStandardMaterial({ color: '#232b27', roughness: .47, metalness: .06 }),
    lead: new THREE.MeshStandardMaterial({ color: '#a7ada7', roughness: .43, metalness: .75 }),
    platePositive: new THREE.MeshStandardMaterial({ color: '#676658', roughness: .58, metalness: .4 }),
    plateNegative: new THREE.MeshStandardMaterial({ color: '#6b7775', roughness: .53, metalness: .38 }),
    separator: new THREE.MeshStandardMaterial({ color: '#c5c7ad', roughness: .94 }),
    electrolyte: new THREE.MeshStandardMaterial({ color: '#a9c474', roughness: .4, transparent: true, opacity: .25, depthWrite: false }),
    connection: new THREE.MeshStandardMaterial({ color: '#858f80', roughness: .45, metalness: .7, emissive: '#78cf3e', emissiveIntensity: 0 })
  };
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({ color: '#131913', roughness: .71, metalness: .1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.62;
  scene.add(floor);

  const shell = new THREE.Group();
  const top = new THREE.Group();
  const battery = new THREE.Group();
  battery.add(shell, top);
  scene.add(battery);

  const geometries = new Map();
  function box(parent, x, y, z, w, h, d, material, radius = .018) {
    const id = [w, h, d, radius].join('/');
    if (!geometries.has(id)) geometries.set(id, new RoundedBoxGeometry(w, h, d, 2, radius));
    const mesh = new THREE.Mesh(geometries.get(id), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  // Open vessel, six internal compartments and ribbed polypropylene housing.
  box(shell, 0, -.55, 0, 3.38, .14, 1.84, materials.casing, .05);
  for (const z of [-.87, .87]) {
    box(shell, 0, -.03, z, 3.35, 1.04, .1, materials.polymer, .03);
    for (let x = -1.36; x < 1.5; x += .24) box(shell, x, -.12, z * 1.064, .027, .65, .035, materials.casing);
  }
  for (const x of [-1.63, 1.63]) {
    box(shell, x, -.03, 0, .11, 1.04, 1.74, materials.polymer, .03);
    box(shell, x, -.47, 0, .17, .11, 1.82, materials.casing);
  }
  for (const x of [-.534, .534]) box(shell, x, -.05, 0, .065, .87, 1.68, materials.casing);
  box(shell, 0, -.05, 0, 3.16, .87, .07, materials.casing);

  box(top, 0, .56, 0, 3.43, .17, 1.89, materials.polymer, .055);
  box(top, 0, .662, .05, 3.25, .055, 1.76, materials.casing, .025);
  for (const x of [-1.33, 1.33]) {
    const terminal = new THREE.Mesh(new THREE.CylinderGeometry(.085, .11, .15, 24), materials.lead);
    terminal.position.set(x, .754, .62);
    top.add(terminal);
    box(top, x, .693, .62, .27, .05, .27, materials.polymer, .025);
    box(top, x, .692, .39, .14, .019, .027, materials.lead);
    if (x > 0) box(top, x, .693, .39, .027, .019, .14, materials.lead);
  }

  const cells = [];
  for (const z of [-.43, .43]) {
    for (const x of [-1.06, 0, 1.06]) {
      const pack = new THREE.Group();
      pack.position.set(x, 0, z);
      battery.add(pack);
      const liquid = box(pack, 0, -.14, 0, .88, .64, .68, materials.electrolyte);
      liquid.renderOrder = 1;
      const layers = [];
      for (let i = 0; i < 9; i += 1) {
        const separator = i % 2 !== 0;
        const plateMaterial = i % 4 === 0 ? materials.platePositive : materials.plateNegative;
        const layer = box(pack, (i - 4) * .074, 0, 0, separator ? .018 : .042, .76, .57, separator ? materials.separator : plateMaterial);
        layers.push(layer);
      }
      cells.push({ pack, layers, x, z });
    }
  }

  // Series leads are schematic. Highlighting shows a conceptual electrical path.
  const bridges = new THREE.Group();
  battery.add(bridges);
  for (const z of [-.43, .43]) {
    for (const x of [-.53, .53]) box(bridges, x, .42, z, .43, .047, .09, materials.connection);
  }
  box(bridges, 1.21, .42, 0, .078, .047, .64, materials.connection);

  let visible = true;
  let position = 0;
  let disposed = false;
  let scrollTrigger;
  let scrollTween;
  const render = () => {
    if (!disposed && visible && !document.hidden) renderer.render(scene, camera);
  };

  function setPosition(value) {
    position = THREE.MathUtils.clamp(value, 0, 1);
    const opened = easing(position, 0, .65);
    const exposed = easing(position, .22, .86);
    const separated = easing(position, .56, 1);
    top.position.y = 1.28 * opened;
    battery.rotation.y = -.16 * opened;
    bridges.position.y = .59 * exposed;
    materials.connection.emissiveIntensity = .65 * exposed;
    for (const { pack, layers, x, z } of cells) {
      pack.position.set(x * (1 + separated * .16), .57 * exposed, z * (1 + separated * .34));
      layers.forEach((layer, i) => { layer.position.x = (i - 4) * (.074 + .022 * separated); });
    }
    render();
  }

  function resize() {
    if (disposed) return;
    const { width, height } = destination.getBoundingClientRect();
    if (!width || !height) return;
    const aspect = width / height;
    const vertical = Math.max(1.44, 2.42 / aspect);
    camera.left = -vertical * aspect;
    camera.right = vertical * aspect;
    camera.top = vertical;
    camera.bottom = -vertical;
    renderer.setSize(width, height, false);
    camera.updateProjectionMatrix();
    render();
  }

  function followScroll(enabled) {
    scrollTrigger?.kill();
    scrollTween?.kill();
    if (!enabled || disposed) return;
    const travel = { phase: 0 };
    scrollTween = gsap.to(travel, {
      phase: 1,
      ease: 'none',
      onUpdate: () => {
        setPosition(Math.sin(Math.PI * travel.phase));
        onPosition(position);
      },
      scrollTrigger: { trigger: section, start: 'top 82%', end: 'bottom 22%', scrub: .35 }
    });
    scrollTrigger = scrollTween.scrollTrigger;
  }

  const resizeObserver = new ResizeObserver(resize);
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    render();
  });
  destination.appendChild(renderer.domElement);
  resizeObserver.observe(destination);
  visibility.observe(destination);
  document.addEventListener('visibilitychange', render);

  function dispose() {
    if (disposed) return;
    disposed = true;
    followScroll(false);
    resizeObserver.disconnect();
    visibility.disconnect();
    document.removeEventListener('visibilitychange', render);
    canvas.removeEventListener('webglcontextlost', contextLost);
    const usedGeometries = new Set(), usedMaterials = new Set();
    scene.traverse(node => {
      if (node.isMesh) {
        usedGeometries.add(node.geometry);
        usedMaterials.add(node.material);
      }
    });
    usedGeometries.forEach(geometry => geometry.dispose());
    usedMaterials.forEach(material => material.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }

  function contextLost(event) {
    event.preventDefault();
    dispose();
    destination.dispatchEvent(new Event('battery-webgl-lost'));
    onFailure();
  }

  canvas.addEventListener('webglcontextlost', contextLost);
  resize();
  return { setPosition, followScroll, dispose };
}
