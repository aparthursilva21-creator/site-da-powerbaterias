// Cofre do motor procedural (Three.js). Tudo é construído DENTRO do volume sob o capô:
//  x: -0.64..+0.64 | y: 0.33..0.80 | z: 1.00..2.18 (frente do carro = +z).
// O grupo fica invisível com o capô fechado, então nada atravessa a carroceria.
import * as THREE from 'three';

const M = (color, metalness = 0.2, roughness = 0.6, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });

export const MAT = {
  alu: M(0x9aa0a6, 0.95, 0.42), aluDark: M(0x4b4f55, 0.9, 0.5), steel: M(0x2c2f34, 0.9, 0.45),
  chrome: M(0xdfe3e8, 1, 0.12), plastic: M(0x0c0d0e, 0.1, 0.55), plasticRough: M(0x151617, 0.05, 0.85),
  rubber: M(0x0b0b0b, 0, 0.92), floor: M(0x08090a, 0.3, 0.7), paint: M(0x111315, 0.6, 0.35),
  red: M(0xd0281c, 0.3, 0.45), yellow: M(0xf0c000, 0.2, 0.5), blue: M(0x1d6fe0, 0.2, 0.5),
  brass: M(0xb7803a, 0.95, 0.35), rust: M(0x5b3b2a, 0.85, 0.55), coolant: M(0x39d96b, 0.0, 0.2, { transparent: true, opacity: 0.55 }),
  whitePlastic: M(0xcfd3d6, 0, 0.5, { transparent: true, opacity: 0.8 }),
};

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function rrShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
export function rbox(w, h, d, r = 0.01, b = 0.006) {
  r = Math.min(r, w / 2 - b - 0.001, h / 2 - b - 0.001);
  const g = new THREE.ExtrudeGeometry(rrShape(w - 2 * b, h - 2 * b, Math.max(0.001, r)), {
    depth: Math.max(0.001, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 6 });
  g.center(); return g;
}

export function buildEngineBay() {
  // LIMITES MEDIDOS NO GLB: frente da carroceria começa em z≈2.09; paredes internas em |x|≈0.59.
  // Tudo aqui fica em |x|≤0.58 e z≤2.05, então nada pode atravessar o carro.
  const g = new THREE.Group(); g.name = 'EngineBay';
  const add = (geo, mat, x = 0, y = 0, z = 0, o = {}) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
    if (o.rx) m.rotation.x = o.rx; if (o.ry) m.rotation.y = o.ry; if (o.rz) m.rotation.z = o.rz;
    m.castShadow = o.shadow !== false; m.receiveShadow = true; m.frustumCulled = false; (o.parent || g).add(m); return m; };
  const box = (w, h, d, mat, x, y, z, o) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, o);
  const rb = (w, h, d, r, mat, x, y, z, o) => add(rbox(w, h, d, r), mat, x, y, z, o);
  const cyl = (rt, rbm, h, mat, x, y, z, axis = 'y', seg = 28, o = {}) => {
    const geo = new THREE.CylinderGeometry(rt, rbm, h, seg);
    if (axis === 'x') geo.rotateZ(Math.PI / 2); if (axis === 'z') geo.rotateX(Math.PI / 2);
    return add(geo, mat, x, y, z, o); };
  const tube = (pts, r, mat, seg = 48, rs = 12, o = {}) => {
    const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.3);
    return add(new THREE.TubeGeometry(c, seg, r, rs, false), mat, 0, 0, 0, o); };
  const clamp = (x, y, z, axis, r) => cyl(r, r, 0.012, MAT.chrome, x, y, z, axis, 14, { shadow: false });
  const bolt = (x, y, z, r = 0.008) => cyl(r, r, r * 1.3, MAT.chrome, x, y, z, 'y', 6, { shadow: false });
  const EX = -0.12, EZ = 1.5;                                             // centro do motor

  // ───────── ESTRUTURA (dentro das paredes do carro) ─────────
  box(1.14, 0.03, 0.98, MAT.floor, 0, 0.32, 1.54);                       // assoalho
  for (const s of [-1, 1]) {
    box(0.03, 0.5, 0.98, MAT.paint, s * 0.575, 0.57, 1.54);              // parede interna
    const tw = cyl(0.062, 0.082, 0.2, MAT.paint, s * 0.49, 0.62, 1.3);   // torre do amortecedor (compacta)
    cyl(0.048, 0.048, 0.012, MAT.aluDark, s * 0.49, 0.727, 1.3);
    for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5; bolt(s * 0.49 + Math.cos(a) * 0.035, 0.738, 1.3 + Math.sin(a) * 0.035, 0.007); }
    cyl(0.013, 0.013, 0.03, MAT.chrome, s * 0.49, 0.745, 1.3, 'y', 10);
  }
  box(1.14, 0.5, 0.03, MAT.paint, 0, 0.57, 1.0);                         // painel corta-fogo
  // grade do cowl (plástico com aletas, como na foto de referência)
  box(1.1, 0.07, 0.07, MAT.plasticRough, 0, 0.83, 1.03, { shadow: false });
  for (let i = 0; i < 18; i++) box(0.03, 0.05, 0.075, MAT.plastic, -0.51 + i * 0.06, 0.835, 1.035, { shadow: false });
  box(1.1, 0.05, 0.05, MAT.paint, 0, 0.36, 2.03);                        // travessa inferior (por dentro do para-choque)
  box(1.0, 0.04, 0.06, MAT.paint, 0, 0.71, 2.04);                        // travessa superior (por dentro)

  // ───────── MOTOR 4 CILINDROS TRANSVERSAL ─────────
  rb(0.46, 0.07, 0.26, 0.02, MAT.aluDark, EX, 0.34, EZ);                // cárter
  rb(0.52, 0.2, 0.28, 0.015, MAT.alu, EX, 0.46, EZ);                    // bloco
  for (let i = 0; i < 4; i++) box(0.01, 0.2, 0.285, MAT.aluDark, EX - 0.195 + i * 0.13, 0.46, EZ, { shadow: false });
  rb(0.5, 0.11, 0.27, 0.012, MAT.aluDark, EX, 0.615, EZ);               // cabeçote
  // tampa plástica do motor (engine cover) — o elemento que mais "diz motor" visto de cima
  const logo = canvasTex(512, 256, (c, w, h) => {
    c.fillStyle = '#101113'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 2500; i++) { c.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    c.fillStyle = '#c9ced4'; c.font = '800 60px sans-serif'; c.textAlign = 'center'; c.fillText('MOTOR', w / 2, 120);
    c.fillStyle = '#39ff6a'; c.font = '700 30px sans-serif'; c.fillText('ILUSTRATIVO', w / 2, 172); });
  rb(0.47, 0.06, 0.3, 0.035, MAT.plastic, EX, 0.725, EZ);
  rb(0.4, 0.03, 0.24, 0.03, MAT.plasticRough, EX, 0.765, EZ);
  for (let i = 0; i < 6; i++) box(0.38, 0.006, 0.012, MAT.plastic, EX, 0.782, EZ - 0.1 + i * 0.04, { shadow: false });
  add(new THREE.PlaneGeometry(0.2, 0.09), new THREE.MeshStandardMaterial({ map: logo, roughness: 0.5, metalness: 0.3 }), EX, 0.7835, EZ + 0.02, { rx: -Math.PI / 2, shadow: false });
  cyl(0.03, 0.03, 0.035, MAT.plastic, EX - 0.15, 0.795, EZ + 0.05, 'y', 20);                 // bocal de óleo
  cyl(0.022, 0.022, 0.012, MAT.yellow, EX - 0.15, 0.82, EZ + 0.05, 'y', 20, { shadow: false });
  for (let i = 0; i < 4; i++) bolt(EX - 0.17 + i * 0.113, 0.783, EZ + 0.12 + (i % 2 ? 0.004 : 0), 0.008);
  // lado da correia (+x): tampa preta e alternador
  rb(0.04, 0.24, 0.26, 0.012, MAT.plasticRough, EX + 0.27, 0.5, EZ);
  cyl(0.04, 0.04, 0.08, MAT.aluDark, EX + 0.3, 0.62, EZ - 0.08, 'x', 24);
  cyl(0.045, 0.045, 0.025, MAT.steel, EX + 0.31, 0.45, EZ + 0.02, 'x', 24);
  // câmbio (lado -x)
  rb(0.2, 0.2, 0.28, 0.03, MAT.aluDark, EX - 0.34, 0.43, EZ - 0.02);
  cyl(0.075, 0.075, 0.05, MAT.alu, EX - 0.43, 0.42, EZ - 0.03, 'x', 28);
  // coxim
  rb(0.1, 0.05, 0.07, 0.01, MAT.steel, EX - 0.34, 0.56, EZ - 0.02); cyl(0.025, 0.025, 0.04, MAT.rubber, EX - 0.34, 0.595, EZ - 0.02);
  // coletor de escape à frente do motor + protetor térmico
  [-0.16, -0.053, 0.053, 0.16].forEach((x) => tube([[EX + x, 0.6, EZ + 0.135], [EX + x, 0.58, EZ + 0.2], [EX + x * 0.4, 0.5, EZ + 0.24], [EX, 0.42, EZ + 0.26]], 0.02, MAT.rust, 20, 10));
  rb(0.44, 0.17, 0.01, 0.02, MAT.aluDark, EX, 0.55, EZ + 0.29, { shadow: false });
  // admissão (atrás do motor) + corpo de borboleta
  cyl(0.034, 0.034, 0.4, MAT.plastic, EX, 0.69, EZ - 0.2, 'x', 22);
  for (let i = 0; i < 4; i++) tube([[EX - 0.16 + i * 0.107, 0.68, EZ - 0.19], [EX - 0.16 + i * 0.107, 0.68, EZ - 0.15], [EX - 0.16 + i * 0.107, 0.66, EZ - 0.12]], 0.02, MAT.plastic, 10, 8);
  cyl(0.032, 0.032, 0.06, MAT.alu, EX - 0.23, 0.69, EZ - 0.2, 'x', 22);
  // fiação sobre o motor
  for (const [dz, c] of [[-0.12, 0x111111], [-0.105, 0x9c1a14], [-0.09, 0x1a1a1a]])
    tube([[EX - 0.2, 0.76, EZ + dz], [EX - 0.05, 0.79, EZ + dz - 0.02], [EX + 0.1, 0.79, EZ + dz], [EX + 0.22, 0.74, EZ + dz + 0.02]], 0.006, M(c, 0, 0.8), 24, 6, { shadow: false });
  // vareta de óleo
  tube([[EX + 0.08, 0.5, EZ + 0.14], [EX + 0.08, 0.6, EZ + 0.16], [EX + 0.08, 0.7, EZ + 0.16]], 0.004, MAT.yellow, 10, 6);
  cyl(0.013, 0.013, 0.012, MAT.yellow, EX + 0.08, 0.715, EZ + 0.16, 'y', 10);

  // ───────── LADO ESQUERDO: filtro de ar, fusíveis, freio, limpador ─────────
  rb(0.2, 0.15, 0.2, 0.025, MAT.plastic, -0.45, 0.59, 1.8);              // caixa do filtro de ar
  for (let i = 0; i < 5; i++) box(0.17, 0.006, 0.16, MAT.plasticRough, -0.45, 0.668, 1.8 - 0.06 + i * 0.03, { shadow: false });
  for (const dz of [-0.11, 0.11]) rb(0.025, 0.035, 0.02, 0.004, MAT.steel, -0.45, 0.6, 1.8 + dz);
  tube([[-0.45, 0.6, 1.69], [-0.46, 0.7, 1.6], [-0.38, 0.74, 1.5], [EX - 0.2, 0.7, EZ - 0.17]], 0.034, MAT.rubber, 50, 14);   // duto de ar
  clamp(-0.45, 0.6, 1.7, 'z', 0.04);
  rb(0.17, 0.08, 0.13, 0.015, MAT.plastic, -0.46, 0.64, 1.1);            // caixa de fusíveis
  box(0.15, 0.008, 0.11, MAT.plasticRough, -0.46, 0.684, 1.1, { shadow: false });
  cyl(0.1, 0.1, 0.1, MAT.steel, 0.3, 0.64, 1.07, 'z', 28);                // servo-freio (lado direito, atrás da bateria)
  cyl(0.028, 0.028, 0.12, MAT.alu, 0.3, 0.64, 1.18, 'z', 16);             // cilindro mestre
  rb(0.05, 0.06, 0.08, 0.01, MAT.whitePlastic, 0.3, 0.7, 1.2, { shadow: false });
  cyl(0.016, 0.016, 0.02, MAT.yellow, 0.3, 0.74, 1.2, 'y', 10);
  rb(0.085, 0.14, 0.12, 0.02, MAT.whitePlastic, 0.5, 0.64, 1.2, { shadow: false });   // reservatório do limpador (direita, atrás)
  cyl(0.028, 0.028, 0.025, MAT.blue, 0.5, 0.725, 1.2, 'y', 14);

  // ───────── LADO DIREITO: reservatório de expansão, relé ─────────
  rb(0.11, 0.15, 0.1, 0.02, MAT.whitePlastic, -0.46, 0.66, 1.84, { shadow: false });
  box(0.098, 0.07, 0.088, MAT.coolant, -0.46, 0.63, 1.84, { shadow: false });
  cyl(0.036, 0.036, 0.03, MAT.blue, -0.46, 0.75, 1.84, 'y', 14);
  tube([[-0.46, 0.6, 1.84], [-0.4, 0.5, 1.75], [EX - 0.1, 0.46, EZ + 0.15]], 0.011, MAT.rubber, 20, 6);
  rb(0.08, 0.05, 0.08, 0.01, MAT.plastic, 0.46, 0.62, 1.02, { shadow: false });

  // ───────── ARREFECIMENTO (por dentro do para-choque: z ≤ 2.05) ─────────
  const fins = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#17191b'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#3b4046'; c.lineWidth = 1; for (let x = 0; x < w; x += 4) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } });
  box(0.86, 0.3, 0.04, new THREE.MeshStandardMaterial({ map: fins, metalness: 0.6, roughness: 0.55 }), 0, 0.53, 1.99);
  for (const s of [-1, 1]) rb(0.05, 0.31, 0.05, 0.01, MAT.plastic, s * 0.455, 0.53, 1.99);
  rb(0.9, 0.035, 0.1, 0.01, MAT.plastic, 0, 0.7, 1.98);                   // cobertura plástica superior do radiador
  for (let i = 0; i < 9; i++) box(0.05, 0.005, 0.09, MAT.plasticRough, -0.4 + i * 0.1, 0.72, 1.98, { shadow: false });
  rb(0.58, 0.3, 0.06, 0.03, MAT.plastic, 0, 0.53, 1.93);                  // defletor do eletroventilador
  const fan = new THREE.Group(); fan.position.set(0, 0.53, 1.9); g.add(fan);
  cyl(0.04, 0.04, 0.04, MAT.plastic, 0, 0, 0, 'z', 18, { parent: fan });
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; const bl = box(0.12, 0.04, 0.006, MAT.plastic, Math.cos(a) * 0.08, Math.sin(a) * 0.08, 0, { parent: fan, shadow: false }); bl.rotation.z = a; bl.rotation.x = 0.3; }
  g.userData.fan = fan;
  tube([[-0.43, 0.65, 1.98], [-0.42, 0.72, 1.85], [-0.3, 0.7, 1.7], [EX - 0.22, 0.67, EZ + 0.1]], 0.022, MAT.rubber, 40, 12);   // mangueira superior
  tube([[0.43, 0.42, 1.97], [0.3, 0.42, 1.92], [0.18, 0.43, 1.8], [EX + 0.2, 0.42, EZ + 0.15]], 0.022, MAT.rubber, 40, 12);          // mangueira inferior
  clamp(-0.43, 0.65, 1.97, 'y', 0.028); clamp(0.43, 0.4, 1.97, 'y', 0.028);

  // ───────── BANDEJA DA BATERIA (lado direito, como na foto de referência) ─────────
  const tray = new THREE.Group(); tray.name = 'Tray'; g.add(tray);
  const TRAY_POS = new THREE.Vector3(0.405, 0.515, 1.72);
  tray.position.copy(TRAY_POS);
  let parts = [], glow = null;
  const trayMat = M(0x1b1e21, 0.6, 0.5), glowMat = new THREE.MeshBasicMaterial({ color: 0x39ff6a, transparent: true, opacity: 0, depthWrite: false });
  const BORDER = 0.04;
  function setTray(bay) {   // bandeja transversal: comprimento da bateria no eixo x, largura no eixo z (como no Gol da foto)
    parts.forEach((m) => { tray.remove(m); m.geometry.dispose(); }); parts = [];
    const X = Math.min(bay.trayL, 0.33), Z = bay.trayW, t = 0.012;
    const mk = (w, hh, d, x, y, z, mat = trayMat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; m.frustumCulled = false; tray.add(m); parts.push(m); return m; };
    mk(X + 0.03, t, Z + 0.03, 0, 0, 0);
    mk(t, BORDER, Z + 0.03, -(X / 2 + 0.012), BORDER / 2, 0); mk(t, BORDER, Z + 0.03, X / 2 + 0.012, BORDER / 2, 0);
    mk(X + 0.03, BORDER, t, 0, BORDER / 2, -(Z / 2 + 0.012)); mk(X + 0.03, BORDER, t, 0, BORDER / 2, Z / 2 + 0.012);
    for (const sx of [-1, 1]) { mk(0.03, 0.012, Z * 0.5, sx * (X / 2 + 0.03), 0.02, 0); mk(0.008, 0.05, 0.008, sx * (X / 2 + 0.03), 0.045, 0, MAT.chrome); }   // ganchos do suporte de fixação
    mk(X - 0.02, 0.17, Z - 0.02, 0, -0.09, 0, MAT.paint);                 // pedestal até o assoalho
    if (glow) tray.remove(glow);
    glow = new THREE.Mesh(new THREE.BoxGeometry(X + 0.035, 0.004, Z + 0.035), glowMat); glow.position.y = 0.008; tray.add(glow); glowMat.opacity = 0;
    tray.userData.bay = bay; }
  setTray({ trayL: 0.26, trayW: 0.19, maxH: 0.2, recommendedAh: [60, 60] });

  g.userData.tray = tray; g.userData.trayTop = TRAY_POS.y + 0.012; g.userData.trayBorder = BORDER; g.userData.trayPos = TRAY_POS; g.userData.setTray = setTray;
  g.userData.setGlow = (hex, o) => { glowMat.color.setHex(hex); glowMat.opacity = o; };
  attachBayClip(g);
  return g;
}

// ───────── TRAVA DE CONTORNO: nada do cofre pode aparecer fora do carro ─────────
// Envelope medido no GLB (|x|≤0.60, 0.98≤z≤2.04, y≥0.30 e abaixo da curva interna do capô).
// Planos de corte em espaço do cofre; updateClip() os leva para o mundo a cada frame (o prato gira).
const plane = (nx, ny, nz, c) => { const l = Math.hypot(nx, ny, nz); return new THREE.Plane(new THREE.Vector3(nx / l, ny / l, nz / l), c / l); };
const CLIP_LOCAL = [plane(-1, 0, 0, 0.60), plane(1, 0, 0, 0.60), plane(0, 0, -1, 2.04), plane(0, 0, 1, -0.98), plane(0, 1, 0, -0.30), plane(0, -1, -0.25, 1.245)];
const CLIP_WORLD = CLIP_LOCAL.map((p) => p.clone());
export function attachBayClip(root) {
  root.traverse((o) => { if (!o.material) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.clippingPlanes = CLIP_WORLD; m.clipShadows = true; m.needsUpdate = true; }); });
}
export function updateBayClip(bay) { bay.updateWorldMatrix(true, false); CLIP_LOCAL.forEach((p, i) => CLIP_WORLD[i].copy(p).applyMatrix4(bay.matrixWorld)); }

// ───────── BATERIA AUTOMOTIVA ILUSTRATIVA ─────────
// Medidas em metros. Origem na base, centrada em x/z. L (comprimento) no eixo z, W (largura) no eixo x, H = altura da caixa.
// Anatomia reproduzida: caixa de polipropileno preta com friso de base nas pontas (apoio do suporte de fixação),
// tampa cinza com platô central, 6 tampões de célula, pegas rebaixadas nas pontas, 2 polos cônicos (+ maior, com capa vermelha),
// etiqueta ilustrativa nas duas laterais longas.
export function buildBattery(bat, color = 0x121416) {
  const grp = new THREE.Group(), { L, W, H } = bat;
  const lidH = 0.022, caseH = H - lidH;
  const bodyMat = M(color, 0.05, 0.55), lidMat = M(0x2b3035, 0.05, 0.6), plugMat = M(0x3a4046, 0.05, 0.5), grip = M(0x07080a, 0, 0.85);
  const put = (geo, mat, x, y, z, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; m.frustumCulled = false; grp.add(m); return m; };

  put(rbox(W, caseH, L, 0.008, 0.004), bodyMat, 0, caseH / 2, 0);                                        // caixa
  for (const s of [-1, 1]) {                                                                              // friso de base nas pontas
    put(new THREE.BoxGeometry(W * 0.98, 0.014, 0.018), bodyMat, 0, 0.007, s * (L / 2 + 0.007));
    put(new THREE.BoxGeometry(W * 0.98, 0.016, 0.006), bodyMat, 0, 0.022, s * (L / 2 + 0.001));
  }
  put(rbox(W + 0.003, lidH, L + 0.003, 0.006, 0.003), lidMat, 0, caseH + lidH / 2, 0);                  // tampa
  put(new THREE.BoxGeometry(W * 0.86, 0.007, L * 0.62), lidMat, 0, H + 0.002, 0);                          // platô central
  // 6 tampões de célula (2 fileiras × 3) com anel
  for (const sx of [-1, 1]) for (let i = -1; i <= 1; i++) {
    put(new THREE.CylinderGeometry(0.0125, 0.0125, 0.008, 20), plugMat, sx * W * 0.19, H + 0.008, i * L * 0.2, false);
    put(new THREE.TorusGeometry(0.0125, 0.0018, 8, 20).rotateX(Math.PI / 2), grip, sx * W * 0.19, H + 0.0125, i * L * 0.2, false);
  }
  // pegas rebaixadas nas pontas
  for (const s of [-1, 1]) put(new THREE.BoxGeometry(W * 0.46, 0.022, 0.006), grip, 0, caseH * 0.84, s * (L / 2 + 0.0005), false);
  // polos: ao longo da borda lateral (-x), + de um lado e − do outro
  const tx = -W / 2 + 0.026, tz = L / 2 - 0.04;
  const pos = put(new THREE.CylinderGeometry(0.0095, 0.0125, 0.026, 24), M(0x9aa0a6, 1, 0.3), tx, H + 0.015, tz);
  const neg = put(new THREE.CylinderGeometry(0.0082, 0.0108, 0.026, 24), M(0x9aa0a6, 1, 0.3), tx, H + 0.015, -tz);
  put(new THREE.CylinderGeometry(0.0145, 0.0145, 0.006, 24), MAT.red, tx, H + 0.007, tz, false);       // capa do polo positivo
  put(new THREE.CylinderGeometry(0.0125, 0.0125, 0.006, 24), grip, tx, H + 0.007, -tz, false);          // base do negativo
  const sign = (txt, color2) => canvasTex(64, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = color2; c.font = '800 54px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, w / 2, h / 2 + 3); });
  for (const [t, c2, z] of [['+', '#ff4a3a', tz - 0.03], ['−', '#e6e9ec', -tz + 0.03]])
    put(new THREE.PlaneGeometry(0.022, 0.022), new THREE.MeshBasicMaterial({ map: sign(t, c2), transparent: true, depthWrite: false }), tx, H + 0.0062, z, false).rotation.x = -Math.PI / 2;
  // etiqueta nas duas laterais longas
  const label = canvasTex(1024, 512, (c, w, h) => {
    c.fillStyle = '#202326'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#9eea68'; c.fillRect(0, 0, w, 28);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#fff'; c.font = '800 105px sans-serif'; c.fillText('BATERIA', w / 2, 230);
    c.fillStyle = '#dadfe1'; c.font = '700 64px sans-serif'; c.fillText('ILUSTRATIVA', w / 2, 360);
  });
  const labMat = new THREE.MeshStandardMaterial({ map: label, roughness: 0.4 });
  for (const s of [-1, 1]) { const lab = put(new THREE.PlaneGeometry(L * 0.84, caseH * 0.62), labMat, s * (W / 2 + 0.0012), caseH * 0.5, 0, false); lab.rotation.y = s * Math.PI / 2; }
  grp.userData.bodyMat = bodyMat; return grp;
}
