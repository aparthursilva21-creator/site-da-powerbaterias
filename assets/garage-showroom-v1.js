/**
 * POWER GARAGE 3D — Sprint 01
 * Modelo real GLB CC BY 4.0 (Sport Sedan by vinish.dev).
 * Gira a malha em 360º. Capô e motor NÃO estão implementados.
 * Um arquivo local GLB também pode ser aberto temporariamente no navegador.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const viewer = document.getElementById('pgxViewer');
if (viewer) {
  const wrap = document.getElementById('pgxCanvasWrap');
  const canvas = document.getElementById('pgxCanvas');
  const status = document.getElementById('pgxModelStatus');
  const pauseBtn = document.getElementById('pgxPause');
  const resetBtn = document.getElementById('pgxReset');
  const frontBtn = document.getElementById('pgxFront');
  const upload = document.getElementById('pgxUpload');
  const form = document.getElementById('v7GarageForm');
  const FOLDER_MODEL = 'assets/power-garage-car.glb'; // Troque para este caminho ao colocar seu GLB no GitHub.
  const DEMO_MODEL = 'https://models.vinish.dev/realistic-cars/sport-sedan.glb';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = () => window.innerWidth < 800;
  let renderer, scene, camera, controls, rig, currentAsset, currentURL, animationId = 0;
  let spinning = !reduce.matches, visible = true, ready = false, lastTime = 0;
  let transition = null, token = 0;
  let hoodPivot = null, hoodInitialX = 0, hoodMotion = null;

  function say(message) {
    if (status) status.textContent = message;
  }
  function setUIState(mode) {
    viewer.dataset.pgxState = mode;
    const ok = mode === 'loaded';
    [pauseBtn,resetBtn,frontBtn].forEach(button => {
      if (button) button.disabled = !ok;
    });
  }
  function updateSpinButton() {
    if (!pauseBtn) return;
    pauseBtn.textContent = spinning ? 'Ⅱ Pausar' : '▶ Girar';
    pauseBtn.setAttribute('aria-pressed', String(!spinning));
    pauseBtn.setAttribute('aria-label', spinning ? 'Pausar rotação do carro' : 'Retomar rotação do carro');
  }
  function clamp(n,lo,hi) { return Math.max(lo,Math.min(hi,n)); }
  function cubic(t) { return 1-Math.pow(1-t,3); }

  try {
    scene = new THREE.Scene();
    scene.background = null;
    scene.fog = new THREE.Fog(0x090f0b,10,23);
    camera = new THREE.PerspectiveCamera(38,1,.1,80);
    camera.position.set(6.8,3.3,8.3);

    renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,mobile()?1.35:1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x070d08,0);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const studioEnv = pmrem.fromScene(new RoomEnvironment(),.04);
    scene.environment = studioEnv.texture;
    pmrem.dispose();

    controls = new OrbitControls(camera,canvas);
    controls.target.set(0,.9,0);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = .075;
    controls.minDistance = 5.4;
    controls.maxDistance = 13.2;
    controls.minPolarAngle = .32;
    controls.maxPolarAngle = Math.PI*.485;
    controls.update();

    scene.add(new THREE.HemisphereLight(0xe3ffe0,0x19251d,2.3));
    const key = new THREE.DirectionalLight(0xe7f7e8,3.9);
    key.position.set(-3,9,6);
    key.castShadow=true; key.shadow.mapSize.set(1024,1024);
    key.shadow.camera.left=-9;key.shadow.camera.right=9;
    key.shadow.camera.top=9;key.shadow.camera.bottom=-9;
    key.shadow.bias=-.0002;
    scene.add(key);
    const rear = new THREE.DirectionalLight(0x83d44b,3.7);
    rear.position.set(5,4,-5);scene.add(rear);
    const side = new THREE.PointLight(0xffffff,48,14,2);
    side.position.set(4,4,2);scene.add(side);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100,100),
      new THREE.MeshStandardMaterial({color:0x101913,roughness:.36,metalness:.13}));
    floor.rotation.x=-Math.PI/2;floor.position.y=-.115;floor.receiveShadow=true;scene.add(floor);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.65,3.7,.16,96),
      new THREE.MeshStandardMaterial({color:0x161e18,metalness:.62,roughness:.33}));
    base.position.y=-.03;base.receiveShadow=true;scene.add(base);
    const ringMaterial = new THREE.MeshBasicMaterial({color:0x6faf4a,transparent:true,opacity:.57});
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.55,.014,6,128),ringMaterial);
    ring.rotation.x=Math.PI/2;ring.position.y=.056;scene.add(ring);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(3.24,.008,6,128),
      new THREE.MeshBasicMaterial({color:0x607e63,transparent:true,opacity:.55}));
    rim.rotation.x=Math.PI/2;rim.position.y=.058;scene.add(rim);

    rig = new THREE.Group();
    scene.add(rig);
    canvas.setAttribute('tabindex','0');
    canvas.setAttribute('aria-label','Visualizador tridimensional do carro: use o mouse ou o dedo para girar e o scroll para aproximar');
    controls.addEventListener('start',()=>{
      if(!ready) return;
      spinning=false;updateSpinButton();
    });

    function resize() {
      const r=wrap.getBoundingClientRect();
      if(!r.width||!r.height)return;
      camera.aspect=r.width/r.height;
      camera.fov=mobile()?46:38;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,mobile()?1.35:1.8));
      renderer.setSize(Math.round(r.width),Math.round(r.height),false);
    }
    resize();
    new ResizeObserver(resize).observe(wrap);

    function cleanupAsset() {
      hoodPivot=null;hoodMotion=null;
      if(!currentAsset)return;
      rig.remove(currentAsset);
      currentAsset.traverse(obj=>{
        if(!obj.isMesh)return;
        obj.geometry?.dispose();
        const materials=Array.isArray(obj.material)?obj.material:[obj.material];
        materials.forEach(mat=>mat?.dispose?.());
      });
      currentAsset=null;
    }
    // A cor da carroceria é alterada somente quando o arquivo possui um material de pintura identificável.
    function optionalDarkPaint(root) {
      const edited=new Set();
      root.traverse(obj=>{
        if(!obj.isMesh||!obj.material)return;
        const materials=Array.isArray(obj.material)?obj.material:[obj.material];
        const changed=materials.map(material=>{
          if(!material||!material.color) return material;
          const label=(material.name||'').toLowerCase();
          const meshLabel=(obj.name||'').toLowerCase();
          const qualifies=/(car.?paint|body.?paint|paintwork|body_colou?r|exterior.?paint)/i.test(label) ||
            (/^body$/.test(meshLabel) && /(paint|body|main)/i.test(label));
          if(!qualifies)return material;
          if(edited.has(material.uuid))return material;
          edited.add(material.uuid);
          material.color.set('#121719');
          if('metalness' in material)material.metalness=Math.max(material.metalness,.65);
          if('roughness' in material)material.roughness=.22;
          material.needsUpdate=true;
          return material;
        });
        if(Array.isArray(obj.material))obj.material=changed;
      });
    }
    const loader=new GLTFLoader();
    async function loadModel(source, label, objectURL=false) {
      const thisToken=++token;
      setUIState('loading');
      ready=false;
      say('Carregando modelo 3D: '+label+'…');
      try {
        const gltf=await loader.loadAsync(source);
        if(thisToken!==token)return;
        cleanupAsset();
        const model=gltf.scene;
        // Normalize arbitrary GLB orientation/scales; files from vinish.dev use metres and +Y up.
        const initial=new THREE.Box3().setFromObject(model);
        const size=initial.getSize(new THREE.Vector3());
        const longest=Math.max(size.x,size.z);
        if(!Number.isFinite(longest)||longest<=0)throw Error('O arquivo 3D não contém geometria válida.');
        const scale=4.85/longest;
        model.scale.setScalar(scale);
        const box=new THREE.Box3().setFromObject(model);
        const midpoint=box.getCenter(new THREE.Vector3());
        model.position.set(-midpoint.x,.085-box.min.y,-midpoint.z);
        optionalDarkPaint(model);
        model.traverse(obj=>{
          if(obj.isMesh){obj.castShadow=true;obj.receiveShadow=true;}
        });
        rig.add(model);currentAsset=model;
        // Convenção para arquivos preparados no Blender: criar o objeto Hood_Pivot
        // com origem na dobradiça do capô, sem aplicar a abertura previamente.
        hoodPivot=model.getObjectByName('Hood_Pivot')||null;
        hoodInitialX=hoodPivot?hoodPivot.rotation.x:0;
        hoodMotion=null;
        rig.rotation.set(0,-Math.PI*.13,0);
        camera.position.set(6.8,3.3,8.3);controls.target.set(0,.9,0);
        controls.update();transition=null;
        spinning=!reduce.matches;updateSpinButton();
        ready=true;setUIState('loaded');
        say('Modelo 3D carregado! Arraste para girar; use os botões para controlar.');
        run();
      } catch(error) {
        if(thisToken!==token)return;
        console.error('Power Garage 3D:',error);
        ready=!!currentAsset;
        setUIState(ready?'loaded':'fallback');
        say('Não foi possível carregar este GLB. Você pode testar outro arquivo pelo botão abaixo.');
        if(!ready)spinning=false;
      } finally {
        if(objectURL)URL.revokeObjectURL(source);
      }
    }

    function moveCamera(position,target,duration=1250) {
      if(!ready)return;
      transition={
        start:performance.now(),duration,
        from:camera.position.clone(),to:new THREE.Vector3(...position),
        targetFrom:controls.target.clone(),targetTo:new THREE.Vector3(...target)
      };
    }
    function resetCamera() {
      if(!ready)return;
      if(hoodPivot){hoodPivot.rotation.x=hoodInitialX;hoodMotion=null;}
      rig.rotation.y=-Math.PI*.13;
      moveCamera([6.8,3.3,8.3],[0,.9,0]);
      spinning=!reduce.matches;updateSpinButton();
    }
    pauseBtn?.addEventListener('click',()=>{
      spinning=!spinning;
      updateSpinButton();run();
    });
    resetBtn?.addEventListener('click',resetCamera);
    frontBtn?.addEventListener('click',()=>{
      spinning=false;updateSpinButton();
      // Orienta o carro para enquadramento de inspeção frontal.
      moveCamera([0,2.5,8],[0,.85,0]);
    });
    form?.addEventListener('submit',()=>{
      if(!form.reportValidity()||!ready)return;
      spinning=false;updateSpinButton();
      // Primeira parte cinematográfica: câmera aproxima; se o GLB já tiver
      // Hood_Pivot, o capô se abre no mesmo clique. Sem Hood_Pivot não criamos capô falso.
      moveCamera([3.4,2.25,5.6],[0,1.03,.1],1500);
      if(hoodPivot){
        hoodMotion={start:performance.now()+280,duration:1250,from:hoodPivot.rotation.x,to:hoodInitialX-1.06};
        say('Câmera aproximando. Capô 3D articulado abrindo…');
      }else{
        say('Veículo selecionado. Aproximação demonstrativa — para abrir o capô, prepare Hood_Pivot no Blender.');
      }
    });
    upload?.addEventListener('change',()=>{
      const file=upload.files?.[0];
      if(!file)return;
      if(!file.name.toLowerCase().endsWith('.glb')){
        say('Escolha um arquivo .GLB, com texturas incorporadas.');upload.value='';return;
      }
      if(file.size>30*1024*1024){
        say('Este arquivo é muito grande para o teste rápido. Limite: 30 MB.');upload.value='';return;
      }
      const url=URL.createObjectURL(file);
      loadModel(url,file.name,true);
      // Não faz upload para o servidor; o arquivo é aberto somente no navegador.
    });
    reduce.addEventListener?.('change',event=>{
      if(event.matches)spinning=false;
      updateSpinButton();
    });

    function render(timestamp) {
      animationId=0;
      if(document.hidden||!visible)return;
      const dt=clamp((timestamp-lastTime)/1000,0,.04);
      lastTime=timestamp;
      if(ready&&spinning&&!transition)rig.rotation.y+=dt*.21;
      if(hoodMotion&&hoodPivot){
        const k=clamp((timestamp-hoodMotion.start)/hoodMotion.duration,0,1);
        hoodPivot.rotation.x=hoodMotion.from+(hoodMotion.to-hoodMotion.from)*cubic(k);
        if(k>=1)hoodMotion=null;
      }
      if(transition){
        const k=clamp((timestamp-transition.start)/transition.duration,0,1);
        const w=cubic(k);
        camera.position.lerpVectors(transition.from,transition.to,w);
        controls.target.lerpVectors(transition.targetFrom,transition.targetTo,w);
        if(k>=1)transition=null;
      }
      controls.update();
      renderer.render(scene,camera);
      run();
    }
    function run(){
      if(!animationId&&!document.hidden&&visible){
        lastTime=performance.now();
        animationId=requestAnimationFrame(render);
      }
    }
    if('IntersectionObserver' in window){
      new IntersectionObserver(([entry])=>{
        visible=entry.isIntersecting;
        if(visible)run();
        else if(animationId){cancelAnimationFrame(animationId);animationId=0;}
      },{threshold:.02}).observe(viewer);
    }
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)run();});
    setUIState('loading');updateSpinButton();run();
    loadModel(DEMO_MODEL,'Sport Sedan (vinish.dev)');
  }catch(e){
    console.error('Falha ao iniciar o visualizador 3D:',e);
    setUIState('fallback');
    say('Não foi possível iniciar WebGL neste navegador. A apresentação em imagem está disponível.');
  }
}
