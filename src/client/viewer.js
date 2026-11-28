import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { buildEngineBay, buildBattery, updateBayClip } from './garage-engine-bay.js';

const heading = new THREE.Vector3(1, .38, 1.18).normalize();
const orbitInstructions = 'Arraste para girar ou use a pinça para aproximar. Com teclado, use as setas e as teclas + e −.';

function disposeObject(root) {
  const resources = new Set();
  root.traverse(object => {
    if (object.geometry) resources.add(object.geometry);
    if (!object.material) return;
    for (const material of [object.material].flat()) {
      resources.add(material);
      for (const value of Object.values(material)) {
        if (value?.isTexture) resources.add(value);
      }
    }
  });
  for (const resource of resources) resource.dispose();
}

function studio(scene, renderer, floorHeight) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .05);
  room.dispose();
  pmrem.dispose();
  scene.environment = environment.texture;
  scene.background = new THREE.Color(0x121512);
  scene.fog = new THREE.Fog(0x121512, 10, 24);
  scene.add(new THREE.HemisphereLight(0xdbe4e0, 0x202623, 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(4, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.normalBias = .028;
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: .5, far: 20 });
  const rim = new THREE.DirectionalLight(0xc0e6a7, 1.35);
  rim.position.set(-4, 2, -2);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 36),
    new THREE.MeshStandardMaterial({ color: 0x1b201b, roughness: .76, metalness: .25 })
  );
  floor.rotateX(-Math.PI / 2);
  floor.position.y = floorHeight;
  floor.receiveShadow = true;
  const bayLight = new THREE.SpotLight(0xffffff, 0, 8, .5, .55, 2);
  bayLight.position.set(1, 3.2, 3.8);
  bayLight.target.position.set(.25, .5, 1.6);
  scene.add(key, rim, floor, bayLight, bayLight.target);
  return { environment, key, bayLight };
}

export async function mountViewer(viewer) {
  const stage = viewer.querySelector('[data-viewer-canvas]');
  const start = viewer.querySelector('[data-viewer-start]');
  const poster = viewer.querySelector('[data-viewer-poster]');
  const status = viewer.querySelector('[data-viewer-status]');
  const buttons = viewer.querySelector('[data-viewer-controls]');
  const reset = viewer.querySelector('[data-viewer-reset]');
  const hoodButton = viewer.querySelector('[data-viewer-hood]');
  const installButton = viewer.querySelector('[data-viewer-install]');
  const credit = viewer.querySelector('[data-viewer-credit]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.03;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.localClippingEnabled = true;
  const canvas = renderer.domElement;
  canvas.className = 'garage-viewer-canvas';
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Sedã ilustrativo em 3D. Use as setas para girar e mais ou menos para aproximar ou afastar.');
  canvas.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight ArrowUp ArrowDown + -');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, .08, 80);
  let controls, resizeObserver, visibilityObserver, animation, lighting;
  let visible = true;
  let disposed = false;
  const listeners = new AbortController();
  const options = { signal: listeners.signal };

  function dispose() {
    if (disposed) return;
    disposed = true;
    listeners.abort();
    resizeObserver?.disconnect();
    visibilityObserver?.disconnect();
    animation?.kill();
    controls?.dispose();
    disposeObject(scene);
    lighting?.environment.dispose();
    lighting?.key.shadow.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }

  try {
    const loader = new GLTFLoader();
    const modelUrl = new URL(viewer.dataset.model, location.href);
    const asset = await loader.loadAsync(modelUrl.href, event => {
      if (event.lengthComputable) {
        status.textContent = 'Carregando estúdio 3D… ' + Math.min(99, Math.round(event.loaded / event.total * 100)) + '%';
      }
    });
    const car = asset.scene;
    scene.add(car);
    const bounds = new THREE.Box3().setFromObject(car);
    if (bounds.isEmpty()) throw new Error('O modelo não possui geometria.');
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const extent = Math.max(size.x, size.y, size.z);
    const hood = car.getObjectByName('Hood');
    const hoodBase = hood?.rotation.x ?? 0;
    const bay = hood && buildEngineBay();
    if (bay) {
      car.add(bay);
      bay.visible = false;
      updateBayClip(bay);
    }
    car.traverse(object => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
    });
    lighting = studio(scene, renderer, bounds.min.y - .01);
    controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.minPolarAngle = .16;
    controls.maxPolarAngle = 1.48;
    controls.minDistance = extent * .32;
    controls.maxDistance = extent * 4;
    controls.rotateSpeed = .68;
    const modelRadius = Math.hypot(size.x, size.z) / 2;
    const defaultTarget = new THREE.Vector3(center.x, bounds.min.y + size.y * .44, center.z);
    const openTarget = new THREE.Vector3(0, .71, 1.41);
    const installTarget = new THREE.Vector3(.32, .69, 1.66);
    const bayDirection = new THREE.Vector3(.32, .58, .77).normalize();
    const openPose = () => openTarget.clone().addScaledVector(bayDirection, 3.9 * Math.max(1, 1.15 / camera.aspect));
    const installPose = () => installTarget.clone().addScaledVector(bayDirection, 2.4 * Math.max(1, 1.15 / camera.aspect));
    const defaultPose = () => {
      const shortFov = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * Math.min(1, camera.aspect));
      return defaultTarget.clone().addScaledVector(heading, modelRadius / Math.tan(shortFov) * 1.05);
    };
    let open = false;
    let sized = false;
    let battery;

    const render = () => {
      if (disposed || !visible) return;
      renderer.render(scene, camera);
    };

    const setCamera = (position, target) => {
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
    };

    function resize() {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (!sized) setCamera(defaultPose(), defaultTarget);
      sized = true;
      render();
    }

    function showScene(openHood, install = false, focus = hoodButton) {
      animation?.kill();
      open = openHood;
      const initialPosition = camera.position.clone();
      const initialTarget = controls.target.clone();
      const initialHood = hood ? hood.rotation.x : 0;
      const nextHood = hoodBase - (openHood ? 1.22 : 0);
      const target = install ? installTarget : openHood ? openTarget : defaultTarget;
      const position = install ? installPose() : openHood ? openPose() : defaultPose();

      if (battery) battery.visible = false;
      if (install && !battery) {
        battery = buildBattery({ L: .24, W: .16, H: .16 });
        battery.rotation.y = -Math.PI / 2;
        bay.add(battery);
      }
      controls.enabled = false;
      const progress = { camera: 0, hood: 0, battery: 0 };
      function frame() {
        camera.position.lerpVectors(initialPosition, position, progress.camera);
        controls.target.lerpVectors(initialTarget, target, progress.camera);
        camera.lookAt(controls.target);
        if (hood) {
          hood.rotation.x = THREE.MathUtils.lerp(initialHood, nextHood, progress.hood);
          bay.visible = Math.abs(hood.rotation.x - hoodBase) > .27;
          lighting.bayLight.intensity = 50 * Math.max(0, (Math.abs(hood.rotation.x - hoodBase) - .28) / .94);
        }
        if (install) {
          const tray = bay.userData.trayPos;
          battery.visible = progress.battery > 0 && bay.visible;
          battery.position.set(tray.x, bay.userData.trayTop + .64 * (1 - progress.battery), tray.z);
        }
        render();
      }
      function finish() {
        controls.enabled = true;
        hoodButton.textContent = open ? 'Fechar capô' : 'Abrir capô';
        hoodButton.setAttribute('aria-expanded', String(open));
        controls.update();
        status.textContent = install
          ? 'Demonstração ilustrativa concluída. Consulte a equipe para confirmar a instalação do seu veículo.'
          : orbitInstructions;
        if (document.activeElement === document.body) focus.focus({ preventScroll: true });
      }
      if (motion.matches) {
        Object.assign(progress, { camera: 1, hood: 1, battery: 1 });
        frame();
        finish();
        return;
      }
      animation = gsap.timeline({ paused: !visible, onUpdate: frame, onComplete: finish });
      animation.to(progress, { camera: 1, duration: .75, ease: 'power2.inOut' }, 0);
      animation.to(progress, { hood: 1, duration: .65, ease: 'power2.inOut' }, openHood ? .24 : 0);
      if (install) animation.to(progress, { battery: 1, duration: .7, ease: 'power2.out' }, .88);
    }

    reset.addEventListener('click', () => showScene(false, false, reset), options);
    hoodButton.addEventListener('click', () => showScene(!open), options);
    installButton.addEventListener('click', () => showScene(true, true, installButton), options);
    controls.addEventListener('change', render);
    // A roda de um mouse comum continua rolando a página sobre a cena.
    canvas.addEventListener('wheel', event => {
      if (!event.ctrlKey) event.stopImmediatePropagation();
    }, { ...options, capture: true, passive: true });

    canvas.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey || !controls.enabled) return;
      const angle = .12;
      const offset = camera.position.clone().sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      const keys = {
        ArrowLeft: () => { spherical.theta -= angle; },
        ArrowRight: () => { spherical.theta += angle; },
        ArrowUp: () => { spherical.phi -= angle; },
        ArrowDown: () => { spherical.phi += angle; },
        '+': () => { spherical.radius *= .89; },
        '=': () => { spherical.radius *= .89; },
        '-': () => { spherical.radius *= 1.11; }
      };
      if (!Object.hasOwn(keys, event.key)) return;
      event.preventDefault();
      keys[event.key]();
      spherical.phi = THREE.MathUtils.clamp(spherical.phi, controls.minPolarAngle, controls.maxPolarAngle);
      spherical.radius = THREE.MathUtils.clamp(spherical.radius, controls.minDistance, controls.maxDistance);
      camera.position.setFromSpherical(spherical).add(controls.target);
      controls.update();
    }, options);

    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      dispose();
      stage.hidden = true;
      buttons.hidden = true;
      poster.hidden = !poster.naturalWidth;
      start.hidden = false;
      credit.hidden = true;
      status.textContent = 'A visualização 3D foi interrompida. A consulta técnica continua disponível.';
      start.focus({ preventScroll: true });
    }, options);
    window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); }, options);
    visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      animation?.paused(!visible);
      render();
    });
    resizeObserver = new ResizeObserver(resize);

    stage.append(canvas);
    stage.hidden = false;
    poster.hidden = true;
    start.hidden = true;
    buttons.hidden = false;
    credit.hidden = !hood;
    hoodButton.hidden = !hood;
    hoodButton.setAttribute('aria-expanded', 'false');
    installButton.hidden = !hood;
    status.textContent = orbitInstructions;
    visibilityObserver.observe(stage);
    resizeObserver.observe(stage);
    resize();
    canvas.focus({ preventScroll: true });
  } catch (error) {
    dispose();
    stage.hidden = true;
    buttons.hidden = true;
    poster.hidden = !poster.naturalWidth;
    start.hidden = false;
    credit.hidden = true;
    throw error;
  }
}
