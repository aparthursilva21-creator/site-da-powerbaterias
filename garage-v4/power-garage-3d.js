// Power Garage 3D — showroom + cofre do motor + encaixe de bateria.
// Requer Three.js r160+ (importmap na página). Eixos do carro: +z = frente, +x = lado esquerdo, +y = cima.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { BAY_PARTS } from './engine-parts.js';
import { Tweens, ease, evaluateFit, clamp, lerp } from './garage-logic.js';

const GREEN = 0x75c83c;
const BG = 0x050505;
const HOOD_OPEN = 1.25;            // rad (~72°)
const TRAY_TOP = 0.42;             // altura do suporte da bateria
const RIM_H = 0.035;               // altura da borda do suporte
const TWO_PI = Math.PI * 2;

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export class PowerGarage3D {
  /**
   * @param {object} o
   * @param {HTMLElement} o.container  elemento que receberá o <canvas>
   * @param {string} [o.glbUrl]        caminho do GLB com o capô separado
   * @param {boolean} [o.bloom]        brilho dos faróis (desligue em celulares fracos)
   * @param {number} [o.paint]         cor da pintura (hex)
   * @param {(pct:number)=>void} [o.onProgress]
   * @param {(state:string)=>void} [o.onState]    'loading' | 'showroom' | 'approach' | 'engine'
   * @param {(result:object)=>void} [o.onFeedback]
   */
  constructor(o) {
    this.o = Object.assign({
      glbUrl: 'assets/sport-sedan-hood.glb', bloom: true, paint: 0x030303,
      onProgress: null, onState: null, onFeedback: null,
    }, o);
    this.container = this.o.container;
    this.tweens = new Tweens();
    this.state = 'loading';
    this.seq = 0;                       // invalida sequências canceladas
    this.spinTarget = 1;                // 1 = girando, 0 = parado
    this.spin = 1;
    this.userHold = false;
    this.headlightsOn = true;
    this.hoodAngle = 0;
    this.battery = null;
    this.vehicle = null;
    this.shake = { amp: 0, t: 0 };
    this.fitFactor = 1;
    this.reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.reduced) this.spinTarget = 0;
    this.ready = this._init();
  }

  /* ------------------------------------------------------------------ init */
  async _init() {
    const c = this.container;
    const w = Math.max(c.clientWidth, 2), h = Math.max(c.clientHeight, 2);

    const renderer = new THREE.WebGLRenderer({ antialias: !this.o.bloom, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.97;
    // Canvas transparente: a atmosfera deve vir da página inteira, não de um
    // retângulo preto renderizado separadamente atrás do carro.
    renderer.setClearColor(BG, 0);
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;outline:none';
    renderer.domElement.setAttribute('aria-label', 'Carro em 3D. Arraste para girar, role para aproximar.');
    c.appendChild(renderer.domElement);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = new THREE.Fog(BG, 16, 36);
    this.scene = scene;

    this.camera = new THREE.PerspectiveCamera(32, w / h, 0.1, 80);
    this._computeFit(w / h);
    const sp = this._fitPose(this._showroomPose());
    this.camera.position.copy(sp.pos);

    this._buildEnvironment();
    this._buildLights();
    this._buildStage();
    this._buildSmoke();

    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.enablePan = false;
    this.controls.target.copy(sp.target);
    this.controls.addEventListener('start', () => { this.userHold = true; clearTimeout(this._holdT); });
    this.controls.addEventListener('end', () => { clearTimeout(this._holdT); this._holdT = setTimeout(() => (this.userHold = false), 2500); });
    this._setLimits('showroom');
    this.controls.update();

    if (this.o.bloom) {
      const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 });
      this.composer = new EffectComposer(renderer, rt);
      this.composer.setPixelRatio(renderer.getPixelRatio());
      this.composer.setSize(w, h);
      this.composer.addPass(new RenderPass(scene, this.camera));
      this.bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.16, 0.32, 1.35);
      this.composer.addPass(this.bloomPass);
      this.composer.addPass(new OutputPass());
    }

    // Carro
    const gltf = await new GLTFLoader().loadAsync(this.o.glbUrl, (e) => {
      if (e.lengthComputable && this.o.onProgress) this.o.onProgress(e.loaded / e.total);
    });
    this.car = gltf.scene;
    this.turntable.add(this.car);
    this._prepareCar();
    // Assenta a tampa na posição fechada logo no primeiro frame.
    this._setHood(0);
    this._buildBay();
    this._buildTray(null);
    // O motor ilustrativo nunca deve atravessar o capô fechado na vitrine.
    this.bayRoot.visible = false;
    this.tray.visible = false;
    this._offscreenFrames = 0;

    // Observadores
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(c);
    this._io = new IntersectionObserver(([e]) => (this._visible = e.isIntersecting), { threshold: 0.01 });
    this._io.observe(c);
    this._visible = true;

    this.clock = new THREE.Clock();
    renderer.setAnimationLoop(() => this._tick());
    this._setState('showroom');
    return this;
  }

  _setState(s) { this.state = s; this.o.onState && this.o.onState(s); }

  _computeFit(aspect) { this.fitFactor = Math.max(1, Math.pow(1.5 / aspect, 0.85)); }

  /* ------------------------------------------------------------- ambiente */
  _buildEnvironment() {
    // Estúdio escuro com softboxes brancas e faixas verdes — é o que a pintura preta "reflete".
    const env = new THREE.Scene();
    const room = new THREE.Mesh(new THREE.BoxGeometry(24, 12, 24), new THREE.MeshBasicMaterial({ color: 0x050505, side: THREE.BackSide }));
    room.position.y = 5; env.add(room);
    const panel = (w, h, d, x, y, z, color, k) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k) }));
      m.position.set(x, y, z); env.add(m);
    };
    panel(10, 0.2, 2.5, 0, 10.6, 0, 0xffffff, 2.4);        // softbox de teto
    panel(0.2, 3, 8, -11.5, 5, 0, 0xffffff, 1.7);        // lateral esquerda
    panel(0.2, 3, 8, 11.5, 5, 0, 0xffffff, 1.7);         // lateral direita
    // Estúdio neutro: reflexos brancos suaves, sem faixas verdes no fundo.
    panel(12, 0.25, 0.25, 0, 8.5, -7, 0xc3c9c5, 0.34);
    panel(12, 0.25, 0.25, 0, 8.5, 7, 0xc3c9c5, 0.24);
    panel(0.25, 0.25, 14, -6, 7.5, 0xc6ccc8, 0.23);
    panel(0.25, 0.25, 14, 6, 7.5, 0xc6ccc8, 0.23);
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.envTex = pm.fromScene(env, 0.035).texture;
    this.scene.environment = this.envTex;
    pm.dispose();
  }

  _buildLights() {
    const key = new THREE.DirectionalLight(0xffffff, 1.25);
    key.position.set(3, 7, 5); this.scene.add(key);
    // Luzes brancas: realçam a pintura preta sem pintar o fundo de verde.
    const rim1 = new THREE.PointLight(0xbfcac3, 2.4, 11, 2); rim1.position.set(-4.5, 2.6, -3.5); this.scene.add(rim1);
    const rim2 = new THREE.PointLight(0x909995, 1.8, 11, 2); rim2.position.set(4.5, 2.2, -4); this.scene.add(rim2);
    this.bayLight = new THREE.PointLight(0xffffff, 0, 3.2, 2);       // acende no modo cofre
    this.bayLight.position.set(0.2, 1.15, 1.55);
    this.flashLight = new THREE.PointLight(GREEN, 0, 1.8, 2);        // feedback do encaixe
    this.flashLight.position.set(0.43, 0.75, 1.6);
  }

  /* -------------------------------------------------------------- palco */
  _buildStage() {
    const stage = new THREE.Group(); this.scene.add(stage);
    // base fixa
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.15, 3.3, 0.3, 96),
      new THREE.MeshStandardMaterial({ color: 0x070707, roughness: 0.55, metalness: 0.8 }));
    base.position.y = -0.15; stage.add(base);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.0, 0.02, 96),
      new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.29, metalness: 0.75, envMapIntensity: 0.85 }));
    top.position.y = -0.01; stage.add(top);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x505650, transparent: true, opacity: 0.33, toneMapped: true });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(3.12, 0.022, 12, 160), rimMat);
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.005; stage.add(rim);
    // Sem plano de brilho verde sob a plataforma: fundo preto sólido.

    // parte giratória (marcações + carro)
    this.turntable = new THREE.Group(); this.scene.add(this.turntable);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x394039, transparent: true, opacity: 0.19 });
    for (const [r0, r1] of [[2.55, 2.565], [1.95, 1.96]]) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 128), lineMat);
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.012; this.turntable.add(ring);
    }
    for (let i = 0; i < 48; i++) {
      const tick = new THREE.Mesh(new THREE.PlaneGeometry(0.02, i % 4 === 0 ? 0.16 : 0.07), lineMat);
      const a = (i / 48) * TWO_PI;
      tick.position.set(Math.sin(a) * 2.78, 0.013, Math.cos(a) * 2.78);
      tick.rotation.set(-Math.PI / 2, 0, -a); this.turntable.add(tick);
    }
    // sombra de contato
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 6.0), new THREE.MeshBasicMaterial({
      map: this._radialTex('rgba(0,0,0,0.72)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.016; this.turntable.add(sh);
    // as luzes do cofre / feedback giram junto com o carro
    this.turntable.add(this.bayLight, this.flashLight);
  }

  _buildSmoke() {
    // Bruma discreta em cinza frio, atrás da traseira — sem luzes neon.
    const cv=document.createElement('canvas'); cv.width=cv.height=128;
    const ctx=cv.getContext('2d');
    const grad=ctx.createRadialGradient(64,64,5,64,64,64);
    grad.addColorStop(0,'rgba(155,160,153,.38)');
    grad.addColorStop(.4,'rgba(123,132,125,.17)');
    grad.addColorStop(1,'rgba(95,105,99,0)');
    ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);
    const texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;
    this.smoke=[];
    for(let i=0;i<9;i++){
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({
        map:texture,transparent:true,opacity:.14,
        depthWrite:false,depthTest:true,color:0x8f9993
      }));
      sprite.userData={phase:i/9,baseX:-.85+(i%5)*.34,baseZ:-2.26-(i%3)*.23};
      sprite.position.set(sprite.userData.baseX,.19+(i%3)*.12,sprite.userData.baseZ);
      sprite.scale.set(.95+(i%3)*.2,.51+(i%3)*.18,1);
      this.turntable.add(sprite);this.smoke.push(sprite);
    }
  }

  _tickSmoke(dt) {
    if(!this.smoke) return;
    const now=performance.now()*.00013;
    this.smoke.forEach((sprite,i)=>{
      const p=(now+sprite.userData.phase)%1;
      sprite.position.x=sprite.userData.baseX+Math.sin(now*3+i*.8)*.15-p*.17;
      sprite.position.y=.15+p*.55+(i%2)*.06;
      sprite.position.z=sprite.userData.baseZ-p*.32;
      const size=.72+p*.72+(i%3)*.14;
      sprite.scale.set(size,size*.65,1);
      sprite.material.opacity=.10*Math.sin(Math.PI*p);
    });
  }

  _radialTex(inner, outer) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const g = cv.getContext('2d'); const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  /* ---------------------------------------------------------------- carro */
  _prepareCar() {
    const car = this.car;
    this.hood = car.getObjectByName('Hood');
    this.hoodBasePosition = this.hood ? this.hood.position.clone() : null;
    this.hoodBaseRotation = this.hood ? this.hood.rotation.x : 0;
    if (!this.hood) console.warn('[PowerGarage3D] Nó "Hood" não encontrado — use o GLB com o capô separado.');
    this.mats = {};
    car.traverse((n) => {
      if (!n.isMesh) return;
      n.frustumCulled = false;
      const arr = Array.isArray(n.material) ? n.material : [n.material];
      for (const m of arr) this.mats[m.name] = m;
    });
    const M = this.mats;
    // Pintura preto brilhante (verniz)
    const p = M.Paint_Grey;
    if (p) {
      p.color.set(this.o.paint); p.metalness = 0.48; p.roughness = 0.22;
      p.clearcoat = 0.9; p.clearcoatRoughness = 0.1; p.envMapIntensity = 1.3;
    }
    if (M.Glass) { M.Glass.envMapIntensity = 1.6; M.Glass.color.multiplyScalar(0.6); }
    for (const k of ['Chrome', 'Piano', 'Mirror', 'Carbon', 'Alloy_Dark', 'Alloy_Black', 'Cast']) if (M[k]) M[k].envMapIntensity = 1.5;
    if (M.Caliper_Red) M.Caliper_Red.envMapIntensity = 1.2;
    // Faróis e lanternas — emissivos (o brilho vem do bloom)
    this.lampMats = [
      { m: M.LED, on: 1.2, color: [0.78, 0.86, 1] },
      { m: M.Projector, on: 0.7, color: [0.85, 0.93, 1] },
      { m: M.Lamp_Amber, on: 0.9, color: [1, 0.45, 0.02] },
      { m: M.LED_Red, on: 0.65, color: [1, 0.03, 0.02] },
    ].filter((l) => l.m);
    for (const l of this.lampMats) l.m.emissive = new THREE.Color(l.color[0], l.color[1], l.color[2]);

    // Faróis: refletores + cones de luz que giram junto com o carro
    this.headlights = new THREE.Group(); car.add(this.headlights);
    this.beams = [];
    const coneGeo = new THREE.ConeGeometry(1.05, 5.5, 40, 1, true);
    coneGeo.translate(0, -2.75, 0); coneGeo.rotateX(-Math.PI / 2);   // ápice na origem, abre para +z
    for (const s of [1, -1]) {
      const spot = new THREE.SpotLight(0xeaf3ff, 7, 7, 0.33, 0.8, 2); spot.userData.i = 7;
      spot.position.set(0.58 * s, 0.64, 2.1);
      spot.target.position.set(0.4 * s, 0, 7.5);
      this.headlights.add(spot, spot.target);
      const cone = new THREE.Mesh(coneGeo, this._beamMaterial());
      cone.position.set(0.6 * s, 0.64, 2.2); cone.rotation.x = 0.1; cone.renderOrder = 5;
      this.headlights.add(cone); this.beams.push(cone);
    }
    this.setHeadlights(true);
  }

  _beamMaterial() {
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uColor: { value: new THREE.Color(0.55, 0.8, 1.0) }, uK: { value: 0.037 } },
      vertexShader: `varying vec3 vN; varying vec3 vV; varying float vT;
        void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
          vT = clamp(position.z / 5.5, 0.0, 1.0); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform vec3 uColor; uniform float uK; varying vec3 vN; varying vec3 vV; varying float vT;
        void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 1.6); float a = f * pow(1.0 - vT, 1.8) * uK; gl_FragColor = vec4(uColor * a, a); }`,
    });
  }

  setHeadlights(on) {
    this.headlightsOn = !!on;
    for (const l of this.lampMats) l.m.emissiveIntensity = on ? l.on : 0.0;
    // lanterna traseira acesa só como luz de posição
    if (this.mats.LED_Red) this.mats.LED_Red.emissiveIntensity = on ? 0.65 : 0.0;
    this.headlights.children.forEach((c) => { if (c.isSpotLight) c.intensity = on ? c.userData.i : 0; });
    this.beams.forEach((b) => (b.visible = on && !this._beamsHidden));
    return this.headlightsOn;
  }

  /* ----------------------------------------------------- cofre do motor */
  _std(color, rough, metal, extra = {}) {
    return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: metal, envMapIntensity: 1.1 }, extra));
  }

  _finTexture() {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
    const g = cv.getContext('2d'); g.fillStyle = '#20262a'; g.fillRect(0, 0, 256, 64);
    g.strokeStyle = '#6d777c'; g.lineWidth = 1;
    for (let x = 0; x < 256; x += 3) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 64); g.stroke(); }
    g.strokeStyle = 'rgba(0,0,0,.55)'; for (let y = 0; y < 64; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); return t;
  }

  _buildBay() {
    const S = this._std.bind(this);
    const M = {
      floor: S(0x181b18, 0.9, 0.2), metal: S(0x363b39, 0.6, 0.7), wall: S(0x232625, 0.85, 0.3), pad: S(0x121313, 1, 0),
      black: S(0x0d0e0e, 0.55, 0.1), steel: S(0xa0a7a8, 0.3, 0.95), plastic: S(0x1a1d1d, 0.6, 0.1), alu: S(0x9aa1a2, 0.42, 0.9),
      yellow: S(0xe3b21a, 0.5, 0.1), coolant: S(0x2fbf63, 0.2, 0, { transparent: true, opacity: 0.75 }),
      radiator: S(0xffffff, 0.5, 0.6, { map: this._finTexture() }),
      green: S(GREEN, 0.4, 0.1, { emissive: new THREE.Color(GREEN), emissiveIntensity: 0.18 }),
    };
    this.bayMats = M;
    const root = new THREE.Group(); root.name = 'EngineBay'; this.car.add(root);
    this.engineGroup = new THREE.Group(); this.fanGroup = new THREE.Group();
    this.fanGroup.position.set(0, 0.46, 1.915);
    root.add(this.engineGroup, this.fanGroup);
    this.engineGroup.userData.home = this.engineGroup.position.clone();

    for (const p of BAY_PARTS) {
      let geo;
      if (p.k === 'box') geo = new THREE.BoxGeometry(p.s[0], p.s[1], p.s[2]);
      else {
        geo = new THREE.CylinderGeometry(p.r, p.r, p.h, 20);
        if (p.ax === 'x') geo.rotateZ(Math.PI / 2); else if (p.ax === 'z') geo.rotateX(Math.PI / 2);
      }
      const mesh = new THREE.Mesh(geo, M[p.m]);
      mesh.position.set(p.c[0], p.c[1], p.c[2]);
      if (p.rz) mesh.rotation.z = (p.rz * Math.PI) / 180;
      if (p.g === 'fan') { mesh.position.sub(this.fanGroup.position); this.fanGroup.add(mesh); }
      else if (p.g === 'engine') this.engineGroup.add(mesh);
      else root.add(mesh);
    }
    this._detailEngineBay(root);
    this.bayRoot = root;
  }

  _detailEngineBay(root) {
    // Camada adicional de detalhes para melhorar a leitura visual do motor
    // (ilustração técnica genérica, não um motor real de Celta/Onix).
    const rubber = this._std(0x101313,.83,.05);
    const ribbed = this._std(0x202526,.68,.08);
    const alloy = this._std(0x676f6d,.47,.66);
    const steel = this._std(0xaab0aa,.29,.83);
    const clampMat = this._std(0x9ba39f,.38,.8);
    const addPipe=(name,pts,r,mat,segments=24)=>{
      const curve=new THREE.CatmullRomCurve3(pts.map(p=>V(...p)));
      const obj=new THREE.Mesh(new THREE.TubeGeometry(curve,segments,r,10,false),mat);
      obj.name=name;root.add(obj);return obj;
    };
    addPipe('Mangueira de admissão',[[.31,.65,1.18],[.18,.70,1.27],[-.01,.73,1.31],[-.22,.72,1.39]],.064,ribbed);
    addPipe('Mangueira de radiador',[[-.5,.53,1.44],[-.46,.62,1.68],[-.25,.61,1.87],[0,.52,1.98]],.035,rubber);
    addPipe('Duto lateral',[[.63,.50,1.09],[.58,.58,1.22],[.45,.6,1.32]],.018,rubber);
    // pequenos cabos de comando no cabeçote
    for(let i=0;i<4;i++){
      addPipe('Cabo de ignição '+(i+1),[[-.45+i*.095,.73,1.28],[-.39+i*.095,.79,1.37],[-.31+i*.075,.69,1.47]],.006,rubber,16);
    }
    // abraçadeiras e pontos metálicos próximos aos dutos
    for(const [x,y,z] of [[.15,.7,1.27],[-.24,.71,1.4],[-.45,.59,1.7]]){
      const band=new THREE.Mesh(new THREE.TorusGeometry(.04,.006,6,18),clampMat);
      band.rotation.y=Math.PI/3;band.position.set(x,y,z);root.add(band);
    }
    const oilCap=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.018,22),ribbed);
    oilCap.position.set(-.13,.79,1.29);root.add(oilCap);
    const capInner=new THREE.Mesh(new THREE.CylinderGeometry(.041,.041,.019,20),steel);
    capInner.position.set(-.13,.802,1.29);root.add(capInner);
    const badgeCanvas=document.createElement('canvas');badgeCanvas.width=512;badgeCanvas.height=128;
    const bc=badgeCanvas.getContext('2d');
    bc.fillStyle='#1a1f20';bc.fillRect(0,0,512,128);
    bc.strokeStyle='#646c6c';bc.strokeRect(6,6,500,116);
    bc.fillStyle='#d5d9d4';bc.font='600 49px Arial';bc.fillText('ENGINE  /  VISTA 3D',22,79);
    const badgeTex=new THREE.CanvasTexture(badgeCanvas);badgeTex.colorSpace=THREE.SRGBColorSpace;
    const badge=new THREE.Mesh(new THREE.PlaneGeometry(.31,.08),new THREE.MeshBasicMaterial({map:badgeTex,side:THREE.DoubleSide}));
    badge.rotation.x=-Math.PI/2;badge.position.set(-.1,.807,1.54);root.add(badge);
  }

  /** Suporte da bateria: dimensões vêm do veículo (ou padrão se ainda não há veículo). */
  _buildTray(bay) {
    if (this.tray) { this.car.remove(this.tray); this.tray.traverse((n) => { n.geometry && n.geometry.dispose(); }); }
    const L = bay ? bay.trayL : 0.25, W = bay ? bay.trayW : 0.18;
    this.trayPos = V(0.43, 0, 1.6);
    const g = new THREE.Group(); g.position.set(this.trayPos.x, 0, this.trayPos.z);
    const base = new THREE.Mesh(new THREE.BoxGeometry(L + 0.05, TRAY_TOP - 0.30, W + 0.05), this.bayMats.metal);
    base.position.y = 0.30 + (TRAY_TOP - 0.30) / 2; g.add(base);
    const wallM = this.bayMats.black, t = 0.012;
    const wall = (sx, sy, sz, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), wallM); m.position.set(x, TRAY_TOP + sy / 2, z); g.add(m); };
    wall(L + 2 * t, RIM_H, t, 0, W / 2 + t / 2); wall(L + 2 * t, RIM_H, t, 0, -W / 2 - t / 2);
    wall(t, RIM_H, W, L / 2 + t / 2, 0); wall(t, RIM_H, W, -L / 2 - t / 2, 0);
    // contorno luminoso que muda de cor com o feedback
    this.trayGlowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(GREEN).multiplyScalar(0.8) });
    const gl = (sx, sz, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.003, sz), this.trayGlowMat); m.position.set(x, TRAY_TOP + RIM_H + 0.002, z); g.add(m); };
    const e = 0.006;
    gl(L + 2 * t, e, 0, W / 2 + t / 2); gl(L + 2 * t, e, 0, -W / 2 - t / 2); gl(e, W, L / 2 + t / 2, 0); gl(e, W, -L / 2 - t / 2, 0);
    this.tray = g; this.car.add(g);
    this.tray.visible = this.state === 'engine';
    this.flashLight.position.set(this.trayPos.x, 0.75, this.trayPos.z);
  }

  _setTrayColor(hex, k = 1) { this.trayGlowMat.color.set(hex).multiplyScalar(k); }

  /* ------------------------------------------------------------- bateria */
  _labelTexture(b) {
    const w = 640, h = Math.round((640 * b.H) / b.L);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
    g.fillStyle = '#0d1110'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#7dff2e'; g.fillRect(0, 0, w, h * 0.16);
    g.fillStyle = '#071007'; g.font = `800 ${h * 0.11}px Arial, sans-serif`; g.textBaseline = 'middle'; g.fillText('POWER BATERIAS', w * 0.05, h * 0.08);
    g.fillStyle = '#ffffff'; g.font = `800 ${h * 0.34}px Arial, sans-serif`; g.textBaseline = 'alphabetic';
    g.fillText(String(b.ah), w * 0.06, h * 0.68);
    const tw = g.measureText(String(b.ah)).width;
    g.fillStyle = '#7dff2e'; g.font = `800 ${h * 0.17}px Arial, sans-serif`; g.fillText('Ah', w * 0.06 + tw + 10, h * 0.68);
    g.fillStyle = '#9aa7a0'; g.font = `600 ${h * 0.09}px Arial, sans-serif`; g.fillText(`CCA ${b.cca || '—'} A  ·  12 V`, w * 0.06, h * 0.88);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }

  _makeBattery(b) {
    const g = new THREE.Group();
    const lid = 0.016;
    const tex = this._labelTexture(b);
    const side = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.1 });
    const plain = new THREE.MeshStandardMaterial({ color: 0x101413, roughness: 0.55, metalness: 0.1 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(b.L, b.H - lid, b.W), [plain, plain, plain, plain, side, side]);
    body.position.y = (b.H - lid) / 2; g.add(body);
    const top = new THREE.Mesh(new THREE.BoxGeometry(b.L + 0.006, lid, b.W + 0.006), new THREE.MeshStandardMaterial({ color: 0x1b201f, roughness: 0.45, metalness: 0.15 }));
    top.position.y = b.H - lid / 2; g.add(top);
    const lead = new THREE.MeshStandardMaterial({ color: 0xb8bcbc, roughness: 0.3, metalness: 0.95 });
    const post = (x, red) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.0105, 0.0125, 0.022, 14), lead); p.position.set(x, b.H + 0.011, -(b.W / 2 - 0.032)); g.add(p);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0145, 0.0145, 0.006, 14), new THREE.MeshStandardMaterial({ color: red ? 0xd01818 : 0x151515, roughness: 0.5 }));
      cap.position.set(x, b.H + 0.003, -(b.W / 2 - 0.032)); g.add(cap);
    };
    post(-(b.L / 2 - 0.038), true); post(b.L / 2 - 0.038, false);
    g.userData = { b, w: b.W, l: b.L };
    return g;
  }

  async _removeBattery(animated = true) {
    const old = this.battery; if (!old) return;
    this.battery = null;
    this._clearCables();
    if (animated) {
      const y0 = old.position.y, s0 = old.scale.x;
      await this.tweens.add({ dur: 0.35, ease: ease.in, update: (k) => { old.position.y = y0 + k * 0.7; old.scale.setScalar(lerp(s0, 0.01, k)); } });
    }
    old.parent && old.parent.remove(old);
    old.traverse((n) => { if (n.geometry) n.geometry.dispose(); if (n.material) [].concat(n.material).forEach((m) => { m.map && m.map.dispose(); m.dispose(); }); });
  }

  _clearCables() {
    if (!this.cables) return;
    for (const c of this.cables) { this.car.remove(c); c.geometry.dispose(); c.material.dispose(); }
    this.cables = null;
  }

  _buildCables(b, restX, restY) {
    const z = this.trayPos.z - (b.W / 2 - 0.032), y = restY + b.H + 0.022;
    const posT = V(restX - (b.L / 2 - 0.038), y, z), negT = V(restX + (b.L / 2 - 0.038), y, z);
    const red = new THREE.CatmullRomCurve3([posT, V(posT.x - 0.02, y + 0.05, z - 0.06), V(0.38, 0.72, 1.22), V(0.50, 0.62, 1.07)]);
    const blk = new THREE.CatmullRomCurve3([negT, V(negT.x + 0.03, y + 0.04, z - 0.04), V(0.64, 0.56, 1.34), V(0.69, 0.48, 1.40)]);
    const mk = (curve, color) => {
      const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.0085, 8, false), new THREE.MeshStandardMaterial({ color, roughness: 0.55 }));
      m.userData.n = m.geometry.index.count; m.geometry.setDrawRange(0, 0); this.car.add(m); return m;
    };
    this.cables = [mk(red, 0xc41414), mk(blk, 0x141414)];
  }

  /**
   * Solta a bateria no cofre e devolve o resultado do encaixe.
   * @returns {Promise<object>} { status:'ok'|'warn'|'nofit', title, message, ... } ou null se cancelado
   */
  async installBattery(batt) {
    if (this.state !== 'engine' || !this.vehicle) return null;
    const my = ++this.seq;
    this.tweens.cancelAll();
    this._setHood(HOOD_OPEN);
    this.busyBattery = true;
    await this._removeBattery(true);
    if (my !== this.seq) return null;

    const bay = this.vehicle.bay;
    const fit = evaluateFit(bay, batt);
    const bat = this._makeBattery(batt);
    this.battery = bat; this.car.add(bat);
    const tp = this.trayPos;
    this._setTrayColor(GREEN, 0.45);

    // posição final
    let restX = tp.x, restY = TRAY_TOP, rotZ = 0, rotX = 0;
    if (fit.status !== 'nofit') {
      restX = tp.x - Math.min(fit.slack.L, 0.05) * 0.45;   // bateria menor fica "folgada" encostada num lado
      restY = TRAY_TOP + 0.001;
    } else if (fit.reason === 'footprint') {
      const over = Math.max(fit.overhang.L, fit.overhang.W);
      const th = clamp(0.07 + over * 1.4, 0.08, 0.26);
      rotZ = th; rotX = fit.overhang.W > 0 ? 0.08 : 0;
      restY = TRAY_TOP + RIM_H + Math.sin(th) * batt.L * 0.5 + 0.004;
      restX = tp.x + fit.overhang.L * 0.25;
    }
    const startY = TRAY_TOP + 1.05;
    bat.position.set(restX, startY, tp.z); bat.rotation.set(0.35, 0.9, -0.28);
    const sfx = this.o.onSound; sfx && sfx('whoosh');

    // 1) queda
    let emitted = false;
    const emit = () => { if (emitted) return; emitted = true; this.o.onFeedback && this.o.onFeedback(Object.assign({ battery: batt, vehicle: this.vehicle }, fit)); };
    const rest = () => { bat.position.set(restX, restY, tp.z); bat.rotation.set(rotX, 0, rotZ); };
    let ok = await this.tweens.add({ dur: 0.62, ease: ease.in, update: (k) => {
      bat.position.y = lerp(startY, restY, k); bat.position.x = restX; bat.rotation.set(lerp(0.35, rotX, ease.out(k)), lerp(0.9, 0, ease.out(k)), lerp(-0.28, rotZ, ease.out(k)));
    } });
    if (!ok || my !== this.seq) return null;
    this._impact(fit.status === 'nofit' ? 0.014 : 0.006);

    if (fit.status === 'nofit') {
      sfx && sfx('thud');
      this._setTrayColor(0xff3030, 2.2); this._flash(0xff3030, 14); emit();
      // 2) ricochete na borda e acomodação torta
      ok = await this.tweens.add({ dur: 0.5, ease: ease.linear, update: (k) => {
        bat.position.y = restY + 0.1 * Math.sin(Math.PI * k) * (1 - 0.4 * k);
        bat.rotation.z = rotZ * (0.35 + 0.65 * k) + 0.07 * Math.sin(Math.PI * 2 * k);
        bat.position.x = restX + 0.02 * Math.sin(Math.PI * k);
      } });
      if (!ok || my !== this.seq) return null;
      this._impact(0.007);
      ok = await this.tweens.add({ dur: 0.7, ease: ease.linear, update: (k) => {
        const d = Math.exp(-5 * k) * Math.sin(16 * k);
        bat.rotation.z = rotZ + 0.045 * d; bat.position.y = restY + 0.006 * Math.abs(d);
      } });
      if (!ok || my !== this.seq) return null;
      rest();
      if (fit.reason === 'height') await this._hoodBump(my);   // (só se a base couber mas a altura não)
      this._setTrayColor(0xff3030, 1.0);
    } else {
      // 2) assentamento: pequeno quique e travamento
      sfx && sfx('click');
      ok = await this.tweens.add({ dur: 0.36, ease: ease.linear, update: (k) => {
        bat.position.y = restY + 0.016 * Math.sin(Math.PI * k) * (1 - k);
      } });
      if (!ok || my !== this.seq) return null;
      bat.position.y = restY;
      const warn = fit.status === 'warn';
      this._setTrayColor(warn ? 0xffb020 : GREEN, 2.4); this._flash(warn ? 0xffb020 : GREEN, warn ? 9 : 12);
      emit(); this._buildCables(batt, restX, restY);
      await this.tweens.add({ dur: 0.55, ease: ease.out, update: (k) => {
        for (const c of this.cables) c.geometry.setDrawRange(0, Math.floor((k * c.userData.n) / 3) * 3);
      } });
      this._setTrayColor(warn ? 0xffb020 : GREEN, 1.0);
    }
    if (my !== this.seq) return null;
    this.busyBattery = false; emit();
    return Object.assign({ battery: batt, vehicle: this.vehicle }, fit);
  }

  /** Quando a bateria é alta demais: o capô tenta fechar e "bate" nela. */
  async _hoodBump(my) {
    if (!this.hood) return;
    const a0 = this.hoodAngle, a1 = 0.62;
    let ok = await this.tweens.add({ dur: 0.7, ease: ease.inOut, update: (k) => this._setHood(lerp(a0, a1, k)) });
    if (!ok || my !== this.seq) return;
    this._impact(0.02); this._flash(0xff3030, 12);
    await this.tweens.add({ dur: 0.7, ease: ease.out, update: (k) => this._setHood(lerp(a1, a0, k) + 0.04 * Math.sin(k * 14) * (1 - k)) });
    this._setHood(a0);
  }

  _impact(a) { this.shake.amp = a; this.shake.t = 0.28; }
  _flash(hex, power) {
    this.flashLight.color.set(hex);
    this.tweens.add({ dur: 0.7, ease: ease.out, update: (k) => (this.flashLight.intensity = power * 0.25 * (1 - k)) });
  }

  /* ------------------------------------------------------------- câmeras */
  _showroomPose() { return { pos: V(4.8, 2.2, 5.9), target: V(0, 0.62, 0) }; }
  _approachPose() { return { pos: V(1.9, 1.55, 6.0), target: V(0.1, 0.65, 1.2) }; }
  _enginePose() { return { pos: V(0.55, 2.35, 3.8), target: V(0.1, 0.5, 1.62) }; }

  _fitPose(p) {
    const dir = p.pos.clone().sub(p.target);
    return { pos: p.target.clone().add(dir.multiplyScalar(this.fitFactor)), target: p.target.clone() };
  }

  _setLimits(mode) {
    const c = this.controls;
    c.minAzimuthAngle = -Infinity; c.maxAzimuthAngle = Infinity; c.minPolarAngle = 0; c.maxPolarAngle = Math.PI;
    c.minDistance = 0.5; c.maxDistance = 40;
    if (mode === 'showroom') { c.minDistance = 4.2; c.maxDistance = 15; c.maxPolarAngle = 1.5; c.enableRotate = true; c.enableZoom = true; }
    if (mode === 'engine') {
      c.minDistance = 1.5; c.maxDistance = 4.8 * this.fitFactor; c.minPolarAngle = 0.25; c.maxPolarAngle = 1.2;
      c.minAzimuthAngle = -0.85; c.maxAzimuthAngle = 0.85; c.enableRotate = true; c.enableZoom = true;
    }
  }

  async _fly(pose, dur, e = ease.inOut) {
    const p = this._fitPose(pose);
    const p0 = this.camera.position.clone(), t0 = this.controls.target.clone();
    this.controls.enabled = false; this._setLimits('free');
    const ok = await this.tweens.add({ dur, ease: e, update: (k) => {
      this.camera.position.lerpVectors(p0, p.pos, k); this.controls.target.lerpVectors(t0, p.target, k);
    } });
    return ok;
  }

  _alignYaw(dur) {
    const y0 = this.turntable.rotation.y, y1 = Math.round(y0 / TWO_PI) * TWO_PI;
    return this.tweens.add({ dur, ease: ease.inOut, update: (k) => (this.turntable.rotation.y = lerp(y0, y1, k)) });
  }

  _setHood(a) {
    // Compensação mínima e reversível da peça Hood importada.
    // A geometria fina só se corrige de forma definitiva no GLB/Blender.
    this.hoodAngle = clamp(a, 0, HOOD_OPEN);
    if (!this.hood) return;
    const t = this.hoodAngle / HOOD_OPEN;
    this.hood.rotation.x = this.hoodBaseRotation - this.hoodAngle;
    this.hood.position.copy(this.hoodBasePosition);
    // Ao fechar, recua alguns milímetros da grade/farol e assenta a borda.
    // O deslocamento diminui quando o capô abre para preservar a dobradiça.
    this.hood.position.y += lerp(-0.018, -0.008, t);
    this.hood.position.z += lerp(-0.032, -0.010, t);
  }

  /* ---------------------------------------------------- sequências (API) */
  /** Define o veículo (ajusta o suporte da bateria) */
  setVehicle(vehicle) {
    this.vehicle = vehicle;
    this._buildTray(vehicle ? vehicle.bay : null);
  }

  /** Para de girar, aproxima, abre o capô e enquadra o cofre. */
  async enterEngineView(vehicle) {
    if (vehicle) this.setVehicle(vehicle);
    if (this.state === 'engine') return true;
    const my = ++this.seq; this.tweens.cancelAll();
    this._setState('approach');
    this.spinTarget = 0;
    this.controls.enabled = false;
    await this._removeBattery(false);
    this.setHeadlights(true); this._beamsHidden = true; this.beams.forEach((b) => (b.visible = false)); this.busyBattery = false;
    const a = this._alignYaw(1.4);
    const f = this._fly(this._approachPose(), 1.5);
    if (!(await Promise.all([a, f])).every(Boolean) || my !== this.seq) return false;
    // Mostrar motor somente quando a tampa começar a abrir evita vazamentos
    // de geometria preta através da lataria durante o giro.
    this.bayRoot.visible = true;
    if (this.tray) this.tray.visible = true;
    const hoodOk = await this.tweens.add({ dur: 1.25, ease: ease.inOut, update: (k) => this._setHood(HOOD_OPEN * k) });
    if (!hoodOk || my !== this.seq) return false;
    this.tweens.add({ dur: 1.1, ease: ease.out, update: (k) => (this.bayLight.intensity = 1.6 * k) });
    if (!(await this._fly(this._enginePose(), 1.6)) || my !== this.seq) return false;
    this._setLimits('engine'); this.controls.enabled = true; this.controls.update();
    this._setState('engine');
    return true;
  }

  /** Fecha o capô e volta ao showroom girando. */
  async exitEngineView() {
    if (this.state === 'showroom') return true;
    const my = ++this.seq; this.tweens.cancelAll();
    this._setState('approach');
    this.controls.enabled = false;
    this._clearCables();
    await this._removeBattery(true);
    this._beamsHidden = false; this.beams.forEach((b) => (b.visible = this.headlightsOn)); this.busyBattery = false;
    this.tweens.add({ dur: 0.8, ease: ease.out, update: (k) => (this.bayLight.intensity = 1.6 * (1 - k)) });
    this._setTrayColor(GREEN, 0.8);
    this._fly(this._approachPose(), 0.9);
    const ok = await this.tweens.add({ dur: 1.0, ease: ease.inOut, update: (k) => this._setHood(HOOD_OPEN * (1 - k)) });
    if (!ok || my !== this.seq) return false;
    this._setHood(0);
    this.bayRoot.visible = false;
    if (this.tray) this.tray.visible = false;
    if (!(await this._fly(this._showroomPose(), 1.5)) || my !== this.seq) return false;
    this._setLimits('showroom'); this.controls.enabled = true; this.controls.update();
    this.vehicle = null;
    if (!this.reduced) this.spinTarget = 1;
    this._setState('showroom');
    return true;
  }

  /** Alterna o capô manualmente (botão "Abrir capô"). Sem veículo, usa o suporte padrão. */
  async toggleHood() {
    if (this.state === 'engine') return this.exitEngineView().then(() => false);
    if (this.state === 'showroom') return this.enterEngineView(this.vehicle || null).then(() => true);
    return this.state === 'engine';
  }

  /** Gira para a frente e enquadra (botão "Frente"). */
  async faceFront() {
    if (this.state !== 'showroom') return;
    const my = ++this.seq; this.tweens.cancelAll();
    this.spinTarget = 0; this.controls.enabled = false;
    const a = this._alignYaw(1.1);
    const f = this._fly({ pos: V(1.2, 1.5, 8.2), target: V(0, 0.62, 0) }, 1.2);
    await Promise.all([a, f]);
    if (my !== this.seq) return;
    this._setLimits('showroom'); this.controls.enabled = true;
    if (!this.reduced) this.spinTarget = 1;
  }

  /** Volta à câmera padrão e retoma o giro (botão "Centralizar"). */
  async recenter() {
    if (this.state !== 'showroom') return;
    const my = ++this.seq; this.tweens.cancelAll();
    this.controls.enabled = false;
    await this._fly(this._showroomPose(), 1.1);
    if (my !== this.seq) return;
    this._setLimits('showroom'); this.controls.enabled = true;
    if (!this.reduced) this.spinTarget = 1;
  }

  setSpin(on) { this.spinTarget = on ? 1 : 0; return this.spinTarget === 1; }
  get isSpinning() { return this.spinTarget === 1; }

  /* ---------------------------------------------------------------- loop */
  _resize() {
    const w = Math.max(this.container.clientWidth, 2), h = Math.max(this.container.clientHeight, 2);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.composer) { this.composer.setSize(w, h); }
    this._computeFit(w / h);
  }

  _tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (!this._visible) return;
    this.tweens.tick(dt);

    // giro da plataforma (com aceleração/freio suaves)
    const want = this.userHold ? 0 : this.spinTarget;
    this.spin += (want - this.spin) * Math.min(1, dt * 3);
    if (this.state === 'showroom' || this.spinTarget === 1) this.turntable.rotation.y += 0.38 * this.spin * dt;

    // motor em marcha lenta + ventoinha
    this._tickSmoke(dt);
    if (this.state === 'engine' || this.hoodAngle > 0.3) {
      const t = performance.now() / 1000;
      this.engineGroup.position.y = Math.sin(t * 38) * 0.0007;
      this.engineGroup.position.x = Math.sin(t * 31 + 1) * 0.0005;
      this.fanGroup.rotation.z -= dt * 7;
    }

    this.controls.update();
    // Proteção do enquadramento: após um gesto/voo de câmera o centro da
    // plataforma nunca deve abandonar a área visível enquanto o carro gira.
    // O giro 360° pertence ao carro; não dependemos de mover a câmera.
    if (this.state === 'showroom' && !this.tweens.busy && !this.userHold) {
      const center = new THREE.Vector3(0, 0.2, 0).project(this.camera);
      const targetOffset = this.controls.target.distanceTo(V(0, 0.62, 0));
      const cameraDistance = this.camera.position.distanceTo(this.controls.target);
      const invalid = !Number.isFinite(center.x) || !Number.isFinite(center.y)
        || Math.abs(center.x) > 0.72 || Math.abs(center.y) > 0.82
        || center.z > 1 || center.z < -1
        || cameraDistance < 4.0 || cameraDistance > 15.5 || targetOffset > 0.8;
      this._offscreenFrames = invalid ? (this._offscreenFrames || 0) + 1 : 0;
      if (this._offscreenFrames > 8) {
        const pose = this._fitPose(this._showroomPose());
        this.camera.position.copy(pose.pos);
        this.controls.target.copy(pose.target);
        this.controls.update();
        this._offscreenFrames = 0;
        console.warn('[PowerGarage] Câmera reenquadrada após perder o centro da plataforma.');
      }
    }
    // tremor de impacto
    let sx = 0, sy = 0;
    if (this.shake.t > 0) { this.shake.t -= dt; const a = this.shake.amp * (this.shake.t / 0.28); sx = (Math.random() - 0.5) * a; sy = (Math.random() - 0.5) * a; }
    this.camera.position.x += sx; this.camera.position.y += sy;
    if (this.composer) this.composer.render(); else this.renderer.render(this.scene, this.camera);
    this.camera.position.x -= sx; this.camera.position.y -= sy;
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this._ro && this._ro.disconnect(); this._io && this._io.disconnect();
    this.controls.dispose(); this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}