/**
 * POWER MOTION / V01 — experiência automotiva Three.js.
 * Assets CC0: 3DAssets.dev executive sedan, cargo scooter, courier.
 * Cena narrativa com câmeras, faróis, fumaça e ambientação.
 * A instalação é dramatização visual, não demonstração técnica.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const root = document.getElementById('powerMotion');
if (root) {
  const canvas = document.getElementById('powerMotionCanvas');
  const msg = document.getElementById('powerMotionStatus');
  const stepText = document.getElementById('powerMotionStep');
  const callout = document.getElementById('powerMotionCall');
  const replay = document.getElementById('powerMotionReplay');
  const toggle = document.getElementById('powerMotionPause');
  const loading = document.getElementById('powerMotionLoading');
  const stageSteps = [...root.querySelectorAll('[data-motion-step]')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowPower = navigator.deviceMemory && navigator.deviceMemory < 3;
  const durations = [2500, 2450, 3150, 4000, 2700];
  const cutoffs = durations.reduce((a, b) => [...a, (a.at(-1) || 0) + b], []);
  const names = ['SEM PARTIDA','PEDIDO DE SOCORRO','POWER A CAMINHO','TROCA DE BATERIA','PARTIDA RECUPERADA','ENERGIA EM MOVIMENTO'];
  const tags = ['FALHA','CHAMADO','RESGATE','INSTALAÇÃO','PARTIDA','NA ESTRADA'];
  let renderer, scene, camera, carRig, carVisual, carMixer;
  let bikeRoot, courierRoot, battery, batteryGlow, wheelNodes = [];
  let headlamps = [], spots = [], particles = [], roadLines = [];
  let playedMs = 0, lastFrame = 0, running = true, onScreen = true, active = true, phase = -1;
  let rafId = 0;
  const loader = new GLTFLoader();

  function setPhase(n) {
    if (n === phase) return;
    phase = n;
    root.dataset.phase = String(n);
    if (msg) msg.textContent = names[n];
    if (stepText) stepText.textContent = String(n+1).padStart(2,'0') + ' / 06';
    if (callout) callout.setAttribute('aria-hidden', n === 1 ? 'false' : 'true');
    stageSteps.forEach((el, i) => el.classList.toggle('is-active', i <= n));
  }
  function phaseAt(ms) {
    return cutoffs.findIndex(time => ms < time) !== -1 ? cutoffs.findIndex(time => ms < time) : 5;
  }
  function clamp(t, a=0, b=1) { return Math.max(a, Math.min(b,t)); }
  function smooth(t) { t = clamp(t); return t*t*(3-2*t); }
  function stageFraction(ms, idx) {
    let previous = idx ? cutoffs[idx-1] : 0;
    return idx >= 5 ? 1 : clamp((ms - previous)/durations[idx]);
  }

  function roundedTexture(label, sub, color = '#8fe846') {
    const cv = document.createElement('canvas'); cv.width=512;cv.height=256;
    const cx = cv.getContext('2d');
    cx.fillStyle = '#0a100b';cx.fillRect(0,0,512,256);
    cx.fillStyle = color;cx.fillRect(0,0,512,18);
    cx.fillStyle = '#f8fff1';cx.textAlign='center';cx.font='900 64px Arial';
    cx.fillText(label, 256, 133);
    cx.font='700 28px Arial';cx.fillStyle=color;cx.fillText(sub,256,181);
    const tx = new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=4;
    return tx;
  }
  function smokeTexture() {
    const cv=document.createElement('canvas');cv.width=cv.height=128;
    const cx=cv.getContext('2d'),g=cx.createRadialGradient(64,64,3,64,64,63);
    g.addColorStop(0,'rgba(140,153,141,.38)');
    g.addColorStop(.3,'rgba(110,125,116,.20)');
    g.addColorStop(.7,'rgba(76,87,81,.065)');
    g.addColorStop(1,'rgba(76,87,81,0)');
    cx.fillStyle=g;cx.fillRect(0,0,128,128);
    return new THREE.CanvasTexture(cv);
  }

  function makeStudio() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080d09,.042);
    camera = new THREE.PerspectiveCamera(36,1,.1,90);
    camera.position.set(7.3,3.7,10.5);
    camera.lookAt(.2,.95,0);

    renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.55;
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x080d09,0);

    scene.add(new THREE.HemisphereLight(0xa6c6b4,0x0d130e,2.1));
    scene.add(new THREE.AmbientLight(0x4b6150,.75));
    const key=new THREE.DirectionalLight(0xf5fff2,3.4);
    key.position.set(1.2,10,7);key.castShadow=true;
    key.shadow.mapSize.set(1024,1024);
    key.shadow.camera.left=-9;key.shadow.camera.right=9;
    key.shadow.camera.top=10;key.shadow.camera.bottom=-10;
    key.shadow.normalBias=.02;
    scene.add(key);
    const fill=new THREE.DirectionalLight(0x9cff6a,4.1);fill.position.set(-5,4,-4);scene.add(fill);
    const rim=new THREE.PointLight(0x91e34f,40,14,2);rim.position.set(-2,2.5,2);scene.add(rim);
    const edge=new THREE.PointLight(0xc4f8d0,18,11,1.5);edge.position.set(4,3,-1.8);scene.add(edge);

    const asphalt=new THREE.Mesh(
      new THREE.PlaneGeometry(80,80),
      new THREE.MeshStandardMaterial({color:0x101511,roughness:.92,metalness:.08})
    );
    asphalt.rotation.x=-Math.PI/2;asphalt.receiveShadow=true;asphalt.position.y=-.018;scene.add(asphalt);
    const floorGlow=new THREE.Mesh(new THREE.CircleGeometry(3.5,60),
      new THREE.MeshBasicMaterial({color:0x76cc45,transparent:true,opacity:.047,depthWrite:false}));
    floorGlow.rotation.x=-Math.PI/2;floorGlow.scale.set(1.4,.65,1);floorGlow.position.y=.006;
    scene.add(floorGlow);

    const roadMat=new THREE.MeshBasicMaterial({color:0x8ab68a,transparent:true,opacity:.32,depthWrite:false});
    for(let i=0;i<14;i++){
      const line=new THREE.Mesh(new THREE.PlaneGeometry(.085,1.22),roadMat);
      line.rotation.x=-Math.PI/2;
      line.position.set(-3.2,.015,(i-7)*2.4);
      line.visible=false;scene.add(line);roadLines.push(line);
    }

    carRig=new THREE.Group();carRig.position.set(0,0,0);scene.add(carRig);
    const lampMat=new THREE.MeshStandardMaterial({color:0xd5ffe0,emissive:0xa5ffc4,emissiveIntensity:.04,roughness:.2});
    for(const x of [-.72,.72]){
      const lamp=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),lampMat.clone());
      lamp.position.set(x,.85,2.58);carRig.add(lamp);headlamps.push(lamp);
      const light=new THREE.SpotLight(0xd8ffdc,0,18,Math.PI/7,.9,1);
      light.position.set(x,.86,2.65);
      const target=new THREE.Object3D();target.position.set(x*1.8,.42,12);
      carRig.add(target);carRig.add(light);light.target=target;spots.push(light);
    }

    const haze=smokeTexture();
    for(let i=0;i<24;i++){
      const mat=new THREE.SpriteMaterial({map:haze,transparent:true,opacity:0,depthWrite:false,color:0x96a395});
      const sprite=new THREE.Sprite(mat);sprite.visible=false;
      sprite.userData={seed:Math.random(),offset:Math.random()*2.3,size:.25+Math.random()*.33,side:i%2?1:-1};
      scene.add(sprite);particles.push(sprite);
    }
    addBattery();
    resize();
    new ResizeObserver(resize).observe(root);
  }

  function resize(){
    if(!renderer||!camera)return;
    const rect=root.getBoundingClientRect();
    const w=Math.max(200,rect.width),h=Math.max(200,rect.height);
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.fov=w<520?45:w<720?42:36;
    camera.position.set(w<520?8.6:7.3,w<520?4.15:3.7,w<520?12.3:10.5);
    camera.lookAt(.15,.9,0);
    camera.updateProjectionMatrix();
  }

  function addBattery(){
    battery=new THREE.Group();
    const box=new THREE.Mesh(new THREE.BoxGeometry(.52,.43,.35),
      new THREE.MeshStandardMaterial({color:0x101b11,metalness:.25,roughness:.4}));
    battery.add(box);
    const sticker=new THREE.Mesh(new THREE.PlaneGeometry(.47,.3),
      new THREE.MeshBasicMaterial({map:roundedTexture('POWER','BATERIAS'),side:THREE.DoubleSide}));
    sticker.position.set(0,-.015,.178);battery.add(sticker);
    for(const x of [-.15,.15]){
      const terminal=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.06,12),
        new THREE.MeshStandardMaterial({color:0xc8c8ba,metalness:.9,roughness:.22}));
      terminal.position.set(x,.25,0);battery.add(terminal);
    }
    batteryGlow=new THREE.PointLight(0x8aff54,0,3);battery.add(batteryGlow);
    battery.visible=false;scene.add(battery);
  }

  async function loadCar(){
    const gltf=await loader.loadAsync('https://cdn.3dassets.dev/assets/18684/v1/model.glb');
    carVisual=gltf.scene;
    const box=new THREE.Box3().setFromObject(carVisual);
    const dim=box.getSize(new THREE.Vector3());
    let scale=5.25/Math.max(dim.z,dim.x);
    carVisual.scale.setScalar(scale);
    const corrected=new THREE.Box3().setFromObject(carVisual);
    const center=corrected.getCenter(new THREE.Vector3());
    carVisual.position.set(-center.x,-corrected.min.y,-center.z);
    // Carro com acabamento grafite/preto; preserva vidros e luzes do arquivo original.
    carVisual.traverse(obj=>{
      if(!obj.isMesh)return;
      obj.castShadow=true;obj.receiveShadow=true;
      if(obj.material){
        let mat=obj.material;
        const name=(mat.name+' '+obj.name).toLowerCase();
        if(/paint|body|car_body|exterior|shell/.test(name) && !/glass|wheel|tyre|tire|light|window/.test(name)){
          const clone=mat.clone();
          if(clone.color)clone.color.set('#11191a');
          if('metalness' in clone)clone.metalness=.8;
          if('roughness' in clone)clone.roughness=.22;
          obj.material=clone;
        }
      }
      if(/wheel|tire|tyre/i.test(obj.name))wheelNodes.push(obj);
    });
    carRig.add(carVisual);
    if(gltf.animations?.length){
      carMixer=new THREE.AnimationMixer(carVisual);
      const clip=gltf.animations.find(a=>/wheel/i.test(a.name))||gltf.animations[0];
      carMixer.clipAction(clip).play();
      carMixer.timeScale=0;
    }
  }

  function normalizeAsset(mesh, targetDepth=2){
    const box=new THREE.Box3().setFromObject(mesh);
    const dim=box.getSize(new THREE.Vector3());
    mesh.scale.setScalar(targetDepth/Math.max(dim.z,dim.x));
    const b=new THREE.Box3().setFromObject(mesh);
    const mid=b.getCenter(new THREE.Vector3());
    mesh.position.set(-mid.x,-b.min.y,-mid.z);
  }
  async function loadBike(){
    const data=await loader.loadAsync('https://cdn.3dassets.dev/assets/173/v1/model.glb');
    bikeRoot=new THREE.Group();scene.add(bikeRoot);
    const model=data.scene;normalizeAsset(model,1.9);
    model.traverse(obj=>{if(obj.isMesh)obj.castShadow=true});
    bikeRoot.add(model);
    const trunk=new THREE.Mesh(new THREE.BoxGeometry(.68,.52,.6),
      new THREE.MeshStandardMaterial({color:0x0b130d,metalness:.36,roughness:.3}));
    trunk.position.set(0,1.13,-.68);
    bikeRoot.add(trunk);
    const frontSign=new THREE.Mesh(new THREE.PlaneGeometry(.59,.33),
      new THREE.MeshBasicMaterial({map:roundedTexture('POWER','BATERIAS'),side:THREE.DoubleSide}));
    frontSign.position.set(0,1.13,-.375);bikeRoot.add(frontSign);
    const sideSign=new THREE.Mesh(new THREE.PlaneGeometry(.55,.34),
      new THREE.MeshBasicMaterial({map:roundedTexture('POWER','BATERIAS'),side:THREE.DoubleSide}));
    sideSign.rotation.y=-Math.PI/2;sideSign.position.set(-.345,1.13,-.68);bikeRoot.add(sideSign);
    bikeRoot.visible=false;bikeRoot.rotation.y=-Math.PI/2;
  }
  async function loadCourier(){
    const data=await loader.loadAsync('https://cdn.3dassets.dev/assets/175/v1/model.glb');
    courierRoot=new THREE.Group();scene.add(courierRoot);
    const model=data.scene;normalizeAsset(model,.78);
    const b=new THREE.Box3().setFromObject(model);
    const size=b.getSize(new THREE.Vector3());
    if(size.y>0)model.scale.multiplyScalar(1.72/size.y);
    const reBox=new THREE.Box3().setFromObject(model);
    model.position.y-=reBox.min.y;
    courierRoot.add(model);
    courierRoot.visible=false;
  }

  function updateScene(dt,nowMs){
    const current=phaseAt(nowMs);
    setPhase(current);
    const frac=stageFraction(nowMs,current);
    const drive=current===5;
    let lampIntensity=0;
    if(current===0)lampIntensity=(Math.sin(nowMs*.027)>0.62 ? 5 : .06);
    if(current>=4)lampIntensity=current===4?Math.max(0,15*smooth(frac*2.5)):15;
    spots.forEach(s=>s.intensity=lampIntensity);
    headlamps.forEach(h=>h.material.emissiveIntensity=lampIntensity/3);
    carRig.position.x=current===0 ? Math.sin(nowMs*.037)*.018 : 0;
    carRig.position.y=drive ? .012*Math.sin(nowMs*.01) : 0;
    carRig.rotation.y=drive?-.08:.0;
    if(carMixer){
      carMixer.timeScale=drive?1.4:0;
      if(drive)carMixer.update(dt);
    } else if(drive){
      wheelNodes.forEach(w=>{w.rotation.x-=dt*8});
    }

    if(bikeRoot){
      const arriving=current===2;
      const parked=current===3;
      const leaving=current===4;
      bikeRoot.visible=arriving||parked||leaving;
      if(arriving){
        let t=smooth(frac);bikeRoot.position.set(7.6+(2.7-7.6)*t,0,2.2+(1.45-2.2)*t);
        bikeRoot.rotation.y=-Math.PI/2;
        bikeRoot.rotation.z=.03*Math.sin(frac*19)*(1-t);
      }else if(parked){
        bikeRoot.position.set(2.7,0,1.45);
        bikeRoot.rotation.y=-Math.PI/2;
        bikeRoot.rotation.z=0;
      }else if(leaving){
        let t=smooth(frac);
        bikeRoot.position.set(2.7+6.2*t,0,1.45-4.2*t);
        bikeRoot.rotation.y=-Math.PI/2-t*.35;
      }
    }
    if(courierRoot){
      courierRoot.visible=current===3;
      if(current===3){
        const p=smooth(frac);
        courierRoot.position.set(2.55-.5*p,0,1.5+.22*p);
        courierRoot.rotation.y=-2.2+Math.sin(nowMs*.006)*.13;
      }
    }
    if(battery){
      battery.visible=current===3;
      if(current===3){
        const p=smooth(frac);
        const p2=smooth((frac-.35)/.53);
        battery.position.set(2.3+(0-2.3)*p2,1.85-(.64*p2),1.3+(.4*p2));
        battery.rotation.y=Math.sin(p*Math.PI)*.4;
        battery.scale.setScalar(1-.44*p2);
        batteryGlow.intensity=4+7*p2;
      }
    }

    particles.forEach((s,i)=>{
      const smoking=drive||current===0;
      if(!smoking){s.visible=false;return;}
      const seed=s.userData.seed, speed=drive?1.2:.42;
      const u=((nowMs*.00032*speed+seed)%1);
      s.visible=true;
      s.position.set((s.userData.side<0?-1.0:1.0)+u*(s.userData.side<0?-1.0:.4),
        .3+u*.9,
        -2.35-u*(drive?3.1:.7));
      const size=s.userData.size*(.65+2*u);
      s.scale.set(size,size,1);
      s.material.opacity=(drive?.19:.08)*(1-u)*Math.min(1,u*7);
    });
    roadLines.forEach((line,i)=>{
      line.visible=drive;
      if(drive){
        const z=((i*2.4-nowMs*.006)%34+34)%34-17;
        line.position.z=z;
      }
    });
    if(camera){camera.position.x=(root.clientWidth<520?8.6:7.3)+Math.sin(nowMs*.00021)*.075;camera.lookAt(.1,.9,0);}
  }

  function render(ts){
    rafId=0;
    if(!running||!onScreen||!active)return;
    if(!lastFrame)lastFrame=ts;
    const dt=Math.min(.05,(ts-lastFrame)/1000);
    lastFrame=ts;
    playedMs+=dt*1000;
    updateScene(dt,playedMs);
    renderer.render(scene,camera);
    rafId=requestAnimationFrame(render);
  }
  function animate(){
    if(!rafId&&running&&onScreen&&active){
      lastFrame=0;rafId=requestAnimationFrame(render);
    }
  }
  function pause(){
    running=false;if(rafId)cancelAnimationFrame(rafId);rafId=0;
    toggle?.setAttribute('aria-label','Continuar animação');
    if(toggle)toggle.textContent='▶';
  }
  function resume(){
    running=true;toggle?.setAttribute('aria-label','Pausar animação');
    if(toggle)toggle.textContent='Ⅱ';animate();
  }
  replay?.addEventListener('click',()=>{
    playedMs=0;setPhase(0);
    if(root.dataset.motionMode==='fallback')return;
    resume();
  });
  toggle?.addEventListener('click',()=>running?pause():resume());
  document.addEventListener('visibilitychange',()=>{
    active=!document.hidden;if(active)animate();
  });
  if('IntersectionObserver' in window){
    new IntersectionObserver(([entry])=>{onScreen=entry.isIntersecting;if(onScreen)animate();},
      {threshold:.04}).observe(root);
  }

  async function start(){
    if(reduced||lowPower){
      root.dataset.motionMode='fallback';
      if(loading)loading.hidden=true;
      if(msg)msg.textContent=reduced?'CENA ESTÁTICA / MOVIMENTO REDUZIDO':'CENA ESTÁTICA / MODO ECONOMIA';
      replay?.setAttribute('hidden','');
      toggle?.setAttribute('hidden','');
      return;
    }
    try{
      makeStudio();
      await loadCar();
      root.dataset.motionMode='3d';
      loading?.setAttribute('hidden','');
      replay?.removeAttribute('hidden');
      toggle?.removeAttribute('hidden');
      setPhase(0);animate();
      // Os personagens não impedem o carregamento da cena principal.
      loadBike().catch(err=>console.warn('POWER MOTION: moto indisponível',err));
      loadCourier().catch(err=>console.warn('POWER MOTION: entregador indisponível',err));
    }catch(err){
      console.warn('POWER MOTION: usando poster estático',err);
      root.dataset.motionMode='fallback';
      if(loading)loading.hidden=true;
      if(msg)msg.textContent='PRONTO PARA SUA PRÓXIMA PARTIDA';
      replay?.setAttribute('hidden','');
      toggle?.setAttribute('hidden','');
      if(renderer)renderer.dispose();
    }
  }
  start();
}
