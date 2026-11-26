import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { VEHICLES, BATTERIES } from '../assets/catalog.js';
import { rankBatteries, Tweens, ease } from '../assets/garage-logic.js';
import { buildEngineBay, buildBattery, attachBayClip, updateBayClip, MAT } from '../assets/engine-bay.js';

const $ = (id) => document.getElementById(id);
const viewport = $('viewport');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HOOD_OPEN = -1.22;            // rad (≈70°). Negativo = frente do capô sobe.
const HOOD_REVEAL = 0.28;           // o motor só aparece depois que o capô já se afastou da carroceria
const GREEN = 0x75c83c, YELLOW = 0xffd23a, RED = 0xff4a3a;

// ───────────── Renderer (canvas com tamanho controlado: evita o "retângulo preto") ─────────────
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) { $('webglFail').hidden = false; $('loading').hidden = true; throw e; }
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.94;
renderer.localClippingEnabled = true; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';
viewport.prepend(renderer.domElement);
renderer.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault());
renderer.domElement.addEventListener('webglcontextrestored', () => { needsResize = true; });

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// near/far folgados: nada da cena é cortado pela câmera
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.07; controls.enablePan = false;
controls.minDistance = 2.6; controls.maxDistance = 19; controls.maxPolarAngle = Math.PI * 0.49; controls.minPolarAngle = 0.25;
// A apresentação gira automaticamente. Não exigir arrastar ou usar botões.
controls.enableRotate = false; controls.enableZoom = false;
controls.rotateSpeed = 0.7;

const VIEW = { pos: new THREE.Vector3(7.5, 2.55, 7.85), tgt: new THREE.Vector3(0, 0.72, 0.1) };
const OPEN_VIEW = { pos: new THREE.Vector3(2.3, 3.05, 4.5), tgt: new THREE.Vector3(0, 0.62, 1.5) };
const BAT_VIEW = { pos: new THREE.Vector3(1.9, 2.3, 3.7), tgt: new THREE.Vector3(0.3, 0.6, 1.6) };
let needsResize = true;
function resize() {
  const w = Math.max(2, viewport.clientWidth), h = Math.max(2, viewport.clientHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix(); needsResize = false;
}
new ResizeObserver(() => (needsResize = true)).observe(viewport);
function distFactor() { return Math.max(1, 1.42 / Math.max(0.5, camera.aspect)); } // garante folga para a plataforma, inclusive no celular
function placeCamera(v) { camera.position.copy(v.pos.clone().sub(v.tgt).multiplyScalar(distFactor()).add(v.tgt)); controls.target.copy(v.tgt); controls.update(); }

// ───────────── Luzes ─────────────
scene.add(new THREE.HemisphereLight(0xc2c2c2, 0x000000, 0.48));
const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(4, 7, 5); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 20 }); scene.add(key);
const rimA = new THREE.DirectionalLight(0x89b17b, 0.95); rimA.position.set(-6, 3, -4); scene.add(rimA);
const rimB = new THREE.DirectionalLight(0xa2b1a0, 0.6); rimB.position.set(6, 2, -5); scene.add(rimB);
const studioGreen = new THREE.PointLight(0x75c83c, 4.0, 11, 2); studioGreen.position.set(-2.9, 1.8, -3.1); scene.add(studioGreen);
const studioFill = new THREE.PointLight(0xb7c4b5, 2.3, 10, 2); studioFill.position.set(3.1, 2.1, 1.3); scene.add(studioFill);
const bayLight = new THREE.SpotLight(0xfff2e0, 0, 9, 0.75, 0.7, 1.6);   // acende quando o capô abre
bayLight.position.set(1.0, 3.4, 3.4); bayLight.target.position.set(0, 0.5, 1.5); scene.add(bayLight, bayLight.target);

// ───────────── Plataforma + carro (giram juntos num "prato giratório") ─────────────
const turntable = new THREE.Group(); scene.add(turntable);
const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.25, 3.25, 0.06, 96), new THREE.MeshStandardMaterial({ color: 0x0a0c0a, metalness: 0.35, roughness: 0.62 }));
disc.position.y = -0.031; disc.receiveShadow = true; turntable.add(disc);
const ring = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.018, 12, 160), new THREE.MeshStandardMaterial({ color: 0x579b39, emissive: 0x75c83c, emissiveIntensity: 0.52, metalness: 0.36, roughness: 0.34 }));
ring.rotation.x = Math.PI / 2; ring.position.y = 0.012; turntable.add(ring);
const ringHalo = new THREE.Mesh(new THREE.TorusGeometry(3.10, 0.052, 8, 160), new THREE.MeshBasicMaterial({ color: 0x75c83c, transparent: true, opacity: 0.11, depthWrite: false }));
ringHalo.rotation.x = Math.PI / 2; ringHalo.position.y = 0.011; turntable.add(ringHalo);
const tickMat = new THREE.MeshBasicMaterial({ color: 0x3d6733, transparent: true, opacity: 0.50, toneMapped: true });
for (let i = 0; i < 72; i++) { const a = (i / 72) * Math.PI * 2, L = i % 6 === 0 ? 0.16 : 0.06;
  const t = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.004, L), tickMat); t.position.set(Math.sin(a) * 2.9, 0.003, Math.cos(a) * 2.9); t.rotation.y = a; turntable.add(t); }
const shadowFloor = new THREE.Mesh(new THREE.CircleGeometry(4.2, 64), new THREE.ShadowMaterial({ opacity: 0.32 }));
shadowFloor.rotation.x = -Math.PI / 2; shadowFloor.position.y = 0.004; shadowFloor.receiveShadow = true; scene.add(shadowFloor);


// Camada cinematográfica 3D — materiais procedurais, sem imagens achatadas.
// O piso é uma malha real e não muda o fundo preto do restante da página.
function makeFloorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#171a18'; ctx.fillRect(0, 0, 512, 512);
  // Variação de asfalto/concreto úmido com granulação determinística.
  let seed = 20261126;
  const rand = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i=0; i<26000; i++) {
    const v=Math.floor(17 + rand()*33);
    ctx.fillStyle='rgba('+v+','+(v+2)+','+v+','+(0.04+rand()*0.14)+')';
    ctx.fillRect(rand()*512,rand()*512,1+rand()*2,1+rand()*2);
  }
  for(let i=0;i<110;i++){
    ctx.strokeStyle='rgba(160,180,165,'+(0.006+rand()*0.018)+')';
    ctx.lineWidth=.25+rand()*.7; ctx.beginPath();
    const x=rand()*512,y=rand()*512;ctx.moveTo(x,y);ctx.lineTo(x+rand()*30,y+rand()*7);ctx.stroke();
  }
  const tex=new THREE.CanvasTexture(canvas);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(2,2);tex.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
  return tex;
}
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(24,24),
  new THREE.MeshStandardMaterial({map:makeFloorTexture(),color:0x444844,metalness:0.38,roughness:0.32,envMapIntensity:0.72})
);
floor.rotation.x=-Math.PI/2;floor.position.y=-0.16;floor.receiveShadow=true;scene.add(floor);
// Reflexos verdes suaves sob a borda, desenhados no plano horizontal.
function radialTexture(inner,mid) {
  const c=document.createElement('canvas');c.width=c.height=256;
  const g=c.getContext('2d');
  const gr=g.createRadialGradient(128,128,0,128,128,127);
  gr.addColorStop(0,inner);gr.addColorStop(.38,mid);gr.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gr;g.fillRect(0,0,256,256);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
const underglow = new THREE.Mesh(
  new THREE.PlaneGeometry(8.7,7.4),
  new THREE.MeshBasicMaterial({map:radialTexture('rgba(117,200,60,0.24)','rgba(117,200,60,0.09)'),transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending})
);
underglow.rotation.x=-Math.PI/2;underglow.position.y=-.147;scene.add(underglow);
const mistTexture=radialTexture('rgba(199,216,197,0.36)','rgba(157,188,154,0.12)');
const cinematicSmoke=new THREE.Group();
turntable.add(cinematicSmoke);
const smoke=[];
for(let i=0;i<18;i++){
  const mat=new THREE.SpriteMaterial({map:mistTexture,color:0xb4c1b5,transparent:true,opacity:0,depthWrite:false});
  const sprite=new THREE.Sprite(mat);
  const phase=i/18;
  sprite.userData={phase,side:(i%2===0?1:-1),lane:i%3};
  sprite.position.set((i%5-2)*.32,.12,-2.05);
  cinematicSmoke.add(sprite);smoke.push(sprite);
}
const smokeClock=new THREE.Clock();
function updateCinematicSmoke(delta) {
  if(reduceMotion){smoke.forEach(x=>x.material.opacity=0);return;}
  const time=smokeClock.getElapsedTime();
  for(const s of smoke){
    const d=s.userData;
    const age=(time*.085+d.phase)%1;
    const drift=Math.sin(time*.48+d.phase*17)*.14;
    s.position.set(d.side*(.36+age*.68)+drift,.18+age*.95,-2.05-age*.7);
    const size=.78+age*1.55+d.lane*.08;
    s.scale.set(size,size*.58,1);
    s.material.opacity=.105*Math.sin(Math.PI*age);
  }
}

const bay = buildEngineBay(); bay.visible = false; turntable.add(bay);
const headlamps = [];
for (const s of [-1, 1]) { const l = new THREE.SpotLight(0xf4f8ff, 14, 9, 0.5, 0.6, 1.5); l.position.set(s * 0.62, 0.78, 2.2); l.target.position.set(s * 0.5, 0.2, 6); turntable.add(l, l.target); headlamps.push(l); }

let car, hood; const lampMats = [];
const tune = (o) => o.traverse((n) => { if (n.material) (Array.isArray(n.material) ? n.material : [n.material]).forEach((m) => { m.envMapIntensity = 1.0; }); });
tune(bay);

new GLTFLoader().load('assets/sport-sedan-hood.glb', (gltf) => {
  car = gltf.scene; hood = car.getObjectByName('Hood');
  car.traverse((n) => {
    if (!n.isMesh) return;
    n.castShadow = true; n.receiveShadow = true; n.frustumCulled = false;   // frustumCulled=false: nunca some peça ao girar
    (Array.isArray(n.material) ? n.material : [n.material]).forEach((m) => {
      m.envMapIntensity = 1.15;
      if (m.name === 'Paint_Grey') {                                           // preto brilhante
        m.color.setHex(0x040506); m.metalness = 0.85; m.roughness = 0.24;
        if ('clearcoat' in m) { m.clearcoat = 1; m.clearcoatRoughness = 0.03; }
      }
      if (m.name === 'Projector' || m.name === 'LED' || m.name === 'LED_Red' || m.name === 'Lamp_Amber') lampMats.push({ m, e: m.emissive.clone(), i: m.emissiveIntensity, name: m.name });
    });
  });
  if (!hood) console.warn('Nó "Hood" não encontrado no GLB.');
  turntable.add(car); setLights(true);
  $('loading').hidden = true;
  const build = $('garageBuildState');
  if (build) { build.dataset.state = hood ? 'ready' : 'warning'; build.textContent = hood ? 'V13 · Capô, motor e baterias 3D disponíveis' : 'V13 · Modelo sem peça Hood'; }
  $('cHood').disabled = !hood;
  resize(); placeCamera(VIEW); needsResize = false;
}, (e) => { if (e.total) $('loadBar').style.width = Math.round((e.loaded / e.total) * 100) + '%'; },
(err) => { console.error('[Power Garage V13] Erro no GLB:', err); $('loading').hidden = true; $('webglFail').hidden = false; $('goBtn').disabled = true; $('cHood').disabled = true; const build=$('garageBuildState'); if(build){build.dataset.state='error'; build.textContent='V13 · Falha ao carregar o modelo 3D';} });

// ───────────── Estado, animações ─────────────
const tw = new Tweens();
const S = { spinOn: !reduceMotion, userPaused: reduceMotion, spin: 0, hoodP: 0, open: false, busy: false, lights: true, veh: null, battery: null };
const SPIN = 0.32;
const camTween = (v, dur = 1.6) => {
  const p0 = camera.position.clone(), t0 = controls.target.clone();
  const p1 = v.pos.clone().sub(v.tgt).multiplyScalar(distFactor()).add(v.tgt);
  controls.enabled = false;
  return tw.add({ dur, ease: ease.inOut, update: (k) => { camera.position.lerpVectors(p0, p1, k); controls.target.lerpVectors(t0, v.tgt, k); camera.lookAt(controls.target); } }).then((ok) => { controls.enabled = true; controls.update(); return ok; });
};
const faceFront = () => {
  const r0 = turntable.rotation.y, tau = Math.PI * 2, r1 = Math.round(r0 / tau) * tau;
  return tw.add({ dur: 1.2, ease: ease.inOut, update: (k) => (turntable.rotation.y = r0 + (r1 - r0) * k) });
};
const setHood = (p) => {
  S.hoodP = p; if (hood) hood.rotation.x = HOOD_OPEN * p;
  const a = Math.abs(HOOD_OPEN * p); bay.visible = a > HOOD_REVEAL; bayLight.intensity = 60 * Math.max(0, (a - 0.3) / 0.9);
};
function setBusy(b) { S.busy = b; $('cHood').disabled = b; }

async function openHood() {
  if (S.open || S.busy || !hood) return; setBusy(true); tw.cancelAll(); hideToast(); S.spinOn = false;
  const a = faceFront(); const c = camTween(OPEN_VIEW, 1.7);
  await Promise.all([a, c]);
  await tw.add({ dur: 1.8, ease: ease.inOut, update: setHood });
  S.open = true; setBusy(false); syncHoodBtn();
}
async function closeHood() {
  if (!S.open || S.busy) return; setBusy(true); tw.cancelAll(); hideToast(); removeBattery();
  await Promise.all([tw.add({ dur: 1.5, ease: ease.inOut, update: (k) => setHood(1 - k) }), camTween(VIEW, 1.7)]);
  S.open = false; S.spinOn = !reduceMotion; setBusy(false); syncHoodBtn();
}
function syncHoodBtn() { $('cHood').innerHTML = S.open ? '<span>⌄</span> Fechar capô' : '<span>⌃</span> Abrir capô'; }

// ───────────── Bateria: queda e encaixe ─────────────
function removeBattery() { if (S.battery) { bay.remove(S.battery); S.battery = null; } bay.userData.setGlow(GREEN, 0); }
async function dropBattery(row) {
  if (!S.open) await openHood(); if (S.busy) return; tw.cancelAll(); hideToast(); removeBattery();
  const { battery: b, fit } = row, base = bay.userData.trayTop, p = bay.userData.trayPos, rim = bay.userData.trayBorder;
  const m = buildBattery(b); attachBayClip(m); const along = b.L > 0.34; m.rotation.y = along ? 0 : -Math.PI / 2; const pz = along ? p.z - 0.1 : p.z; m.position.set(p.x, base + 0.8, pz); m.scale.setScalar(0.01); bay.add(m); S.battery = m; tune(m);
  setBusy(true); camTween(BAT_VIEW, 1.2);
  const tooBig = fit.reason === 'size', rest = tooBig ? base + rim + 0.005 : base;   // grande demais: pousa na borda e não entra
  await tw.add({ dur: 0.35, ease: ease.out, update: (k) => m.scale.setScalar(0.01 + 0.99 * k) });          // aparece
  await tw.add({ dur: tooBig ? 0.75 : 1.1, ease: ease.outBounce, update: (k) => (m.position.y = base + 0.8 + (rest - base - 0.8) * k) });  // cai
  const col = fit.status === 'ok' ? GREEN : fit.status === 'warn' ? YELLOW : RED;
  bay.userData.setGlow(col, 0.85); m.userData.bodyMat.emissive.setHex(col); m.userData.bodyMat.emissiveIntensity = fit.status === 'ok' ? 0 : 0.3;
  if (tooBig) await tw.add({ dur: 0.6, update: (k) => { m.rotation.z = 0.07 * Math.min(1, k * 4); m.position.x = p.x + Math.sin(k * 34) * 0.014 * (1 - k); } });
  else if (fit.status === 'nofit') await tw.add({ dur: 0.5, update: (k) => (m.position.x = p.x + Math.sin(k * 30) * 0.012 * (1 - k)) });
  setBusy(false); showToast(row);
}
const cm = (v) => (v * 100).toFixed(1).replace('.', ',') + ' cm';
const range = (r) => [...new Set(r)].join('–') + ' Ah';
function showToast({ battery: b, fit }) {
  const v = S.veh?.bay; if (!v) return;
  const cls = { ok: 'ok', warn: 'warn', nofit: 'bad' }[fit.status];
  const msg = {
    ok: ['Encaixou na simulação', `No exemplo, ${b.ah} Ah está dentro da faixa simulada. A aplicação real não foi verificada.`],
    low: ['Encaixou, mas não é a faixa do teste', `No exemplo, ${b.ah} Ah fica abaixo da faixa fictícia (${range(v.recommendedAh)}).`],
    high: ['Encaixou, mas não é a faixa do teste', `No exemplo, ${b.ah} Ah fica acima da faixa fictícia (${range(v.recommendedAh)}).`],
    size: ['Não coube no teste', `Bateria ${cm(b.L)} × ${cm(b.W)}; bandeja de exemplo ${cm(v.trayL)} × ${cm(v.trayW)}.`],
    height: ['Não coube no teste', `Altura de exemplo ${cm(b.H)}; limite fictício ${cm(v.maxH)}.`],
  }[fit.reason] || ['Teste visual', 'Consulte as especificações com a Power.'];
  const t=$('toast'); t.className='toast '+cls;
  $('toastIco').textContent=fit.status==='ok'?'✓':fit.status==='warn'?'!':'✕';
  $('toastTitle').textContent=msg[0];
  $('toastMsg').textContent=msg[1]+' Confirme modelo, fixação, polaridade, tecnologia e CCA com a loja.';
  const contact=$('toastCta');
  if(contact){
    const carName=[brand.value,model.value,year.value,engine.value].filter(Boolean).join(' ');
    const waText=`Olá, Power Baterias! Fiz uma SIMULAÇÃO na Power Garage. Meu carro: ${carName}. Exemplo visualizado: ${b.brand} ${b.ah} Ah. Podem verificar as baterias realmente compatíveis, disponibilidade e orçamento?`;
    contact.href=`https://wa.me/5561995191090?text=${encodeURIComponent(waText)}`;
    contact.textContent='Confirmar bateria com a Power ↗';
    contact.hidden=false;
  }
  t.hidden=false; clearTimeout(showToast.h); showToast.h=setTimeout(hideToast,10000);
}
function hideToast() { $('toast').hidden = true; }

// ───────────── Faróis ─────────────
function setLights(on) {
  S.lights = on; headlamps.forEach((l) => (l.visible = on));
  lampMats.forEach(({ m, e, i, name }) => { if (on) { m.emissive.copy(e.getHex() ? e : new THREE.Color(name === 'LED_Red' ? 0xff1a1a : name === 'Lamp_Amber' ? 0xff8a00 : 0xffffff)); m.emissiveIntensity = Math.max(i, name === 'Projector' ? 2.2 : 1.4); } else { m.emissive.copy(e); m.emissiveIntensity = i; } });
  const b = $('cLights'); b.setAttribute('aria-pressed', String(on)); b.innerHTML = `<span>●</span> Faróis ${on ? 'ON' : 'OFF'}`;
}

// ───────────── Loop ─────────────
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (document.hidden) return;
  if (needsResize) { resize(); if (car && !S.open && !S.busy) placeCamera(VIEW); }
  tw.tick(dt);
  S.spin += ((S.spinOn ? SPIN : 0) - S.spin) * Math.min(1, dt * 3.5);       // acelera/freia suave
  if (Math.abs(S.spin) > 1e-4) turntable.rotation.y += S.spin * dt;
  updateCinematicSmoke(dt);
  ring.material.emissiveIntensity = 0.46 + Math.sin(clock.elapsedTime*1.15)*0.075;
  updateBayClip(bay); controls.update(); renderer.render(scene, camera);
});

// ───────────── Interface ─────────────
const brand = $('brand'), model = $('model'), year = $('year'), engine = $('engine');
Object.keys(VEHICLES).forEach((b) => brand.add(new Option(b, b)));
brand.onchange = () => { model.length = 1; model.disabled = !brand.value; model.options[0].text = brand.value ? 'Selecione o modelo' : 'Escolha a marca';
  if (brand.value) Object.keys(VEHICLES[brand.value]).forEach((m) => model.add(new Option(m, m))); $('engineList').innerHTML = ''; };
model.onchange = () => { $('engineList').innerHTML = ''; if (model.value) VEHICLES[brand.value][model.value].engines.forEach((e) => $('engineList').append(new Option(e))); };
year.oninput = () => (year.value = year.value.replace(/\D/g, '').slice(0, 4));

function renderList(el, rows) {
  el.innerHTML = '';
  if (!rows.length) { el.innerHTML = '<li class="empty">Nenhuma nesta categoria.</li>'; return; }
  rows.forEach((r) => { const li = document.createElement('li'), b = document.createElement('button'); b.type = 'button';
    const tag = { ok: 'Encaixa no teste', warn: r.fit.reason === 'low' ? 'Menor na simulação' : 'Maior na simulação', nofit: r.fit.reason === 'height' ? 'Alta no teste' : 'Não cabe no teste' }[r.fit.status];
    const name = `${r.battery.brand} ${r.battery.ah} Ah` + (r.battery.label ? ` · ${r.battery.label}` : '');
    b.className = 'bat ' + r.fit.status; b.innerHTML = `<b>${name}</b><span>${cm(r.battery.L)} × ${cm(r.battery.W)} × ${cm(r.battery.H)}</span><em>${tag}</em>`;
    b.onclick = () => dropBattery(r); li.append(b); el.append(li); });
}
$('vehicleForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!car || !hood) return;
  const ok = brand.value && model.value;
  brand.setAttribute('aria-invalid', String(!brand.value)); model.setAttribute('aria-invalid', String(!model.value)); if (!ok) return;
  S.veh = VEHICLES[brand.value][model.value]; bay.userData.setTray(S.veh.bay);
  $('vehName').textContent = `${brand.value} ${model.value}${year.value ? ' · ' + year.value : ''}`;
  const r = rankBatteries(S.veh.bay, BATTERIES); renderList($('listRec'), r.recommended); renderList($('listOther'), r.others);
  $('vehicleForm').hidden = true; $('batteryStep').hidden = false; removeBattery();
  openHood().then(() => { if (S.open && !S.battery && r.recommended[0]) dropBattery(r.recommended[0]); });   // já mostra a recomendada caindo
});
$('backBtn').onclick = () => { $('batteryStep').hidden = true; $('vehicleForm').hidden = false; hideToast(); closeHood(); };

$('cSpin').onclick = () => { S.userPaused = !S.userPaused; if (!S.open) S.spinOn = !S.userPaused; $('cSpin').innerHTML = S.userPaused ? '<span>▶</span> Girar' : '<span>⏸</span> Pausar'; };
$('cFront').onclick = () => { if (!S.busy) { S.spinOn = false; tw.cancelAll(); faceFront().then(() => { if (!S.open) S.spinOn = !S.userPaused; }); } };
$('cHood').onclick = () => (S.open ? closeHood() : openHood());
$('cLights').onclick = () => setLights(!S.lights);
$('cCenter').onclick = () => { if (!S.busy) camTween(S.open ? OPEN_VIEW : VIEW, 1.1); };
if (reduceMotion) $('cSpin').innerHTML = '<span>▶</span> Girar';
