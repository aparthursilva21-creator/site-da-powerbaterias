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
  const hoodBtn = document.getElementById('pgxHood');
  const lightsBtn = document.getElementById('pgxLights');
  const materialSelect=document.getElementById('pgxMaterialSelect');
  const blackBtn=document.getElementById('pgxPaintBlack');
  const setHeadlampBtn=document.getElementById('pgxSetHeadlamp');
  const upload = document.getElementById('pgxUpload');
  const assetType = document.getElementById('pgxAssetType');
  const form = document.getElementById('v7GarageForm');
  // O proprietário já adicionou o GLB diretamente na raiz do repositório.
  const DEMO_MODEL = 'sport-sedan.glb';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = () => window.innerWidth < 800;
  let renderer, scene, camera, controls, rig, currentAsset, animationId = 0;
  let spinning = !reduce.matches, visible = true, ready = false, lastTime = 0;
  let transition = null, token = 0;
  let hoodPivot = null, hoodInitialX = 0, hoodMotion = null;
  let currentKind = 'car';
  let headlightMaterials = [], headlightsOn = true, hoodIsOpen = false;
  let materialTargets=[];

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

    // Chão redondo com bordas transparentes. O piso retangular antigo
    // criava uma "caixa" visível ao redor do carro.
    const groundCanvas=document.createElement('canvas');
    groundCanvas.width=256;groundCanvas.height=256;
    const ctx=groundCanvas.getContext('2d');
    if(ctx){
      const gradient=ctx.createRadialGradient(128,128,35,128,128,128);
      gradient.addColorStop(0,'rgba(24,33,27,.66)');
      gradient.addColorStop(.58,'rgba(18,29,21,.36)');
      gradient.addColorStop(1,'rgba(10,18,12,0)');
      ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);
    }
    const groundTex=new THREE.CanvasTexture(groundCanvas);
    groundTex.colorSpace=THREE.SRGBColorSpace;
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(9.3,9.3),
      new THREE.MeshBasicMaterial({map:groundTex,transparent:true,depthWrite:false,opacity:.9}));
    floor.rotation.x=-Math.PI/2;floor.position.y=-.126;scene.add(floor);
    // A iluminação da plataforma é discreta e não usa um retângulo de fundo.
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.65,3.7,.16,96),
      new THREE.MeshStandardMaterial({color:0x111813,metalness:.72,roughness:.27}));
    base.position.y=-.03;base.receiveShadow=true;scene.add(base);
    const ringMaterial = new THREE.MeshBasicMaterial({color:0x75b14b,transparent:true,opacity:.27});
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.55,.014,6,128),ringMaterial);
    ring.rotation.x=Math.PI/2;ring.position.y=.056;scene.add(ring);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(3.24,.008,6,128),
      new THREE.MeshBasicMaterial({color:0x5f8660,transparent:true,opacity:.24}));
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
      hoodPivot=null;hoodMotion=null;headlightMaterials=[];hoodIsOpen=false;materialTargets=[];
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
    // Pintura e faróis: alteramos apenas componentes reconhecidos pelo nome.
    // Nunca escurecer vidros/pneus ou instalar faróis falsos no ar.
    function prepareHeadlights(root) {
      headlightMaterials=[];
      root.traverse(mesh=>{
        if(!mesh.isMesh||!mesh.material)return;
        const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
        const mapped=materials.map(source=>{
          if(!source||!source.isMeshStandardMaterial)return source;
          const label=(source.name+' '+mesh.name).toLowerCase();
          if(/rear|tail|brake|stop.?light|lanterna|farol.?traseiro/.test(label))return source;
          if(!/head.?light|headlamp|farol|low.?beam|high.?beam|day.?light|daytime|drl|front.?lamp/.test(label))return source;
          const material=source.clone();
          material.emissive.set('#e8f5ff');
          material.emissiveIntensity=2.4;
          if(material.color)material.color.set('#f2fbff');
          material.needsUpdate=true;
          headlightMaterials.push(material);
          return material;
        });
        mesh.material=Array.isArray(mesh.material)?mapped:mapped[0];
      });
      if(lightsBtn){lightsBtn.disabled=headlightMaterials.length===0;lightsBtn.title=headlightMaterials.length?'Alternar iluminação dos faróis do modelo':'O GLB precisa ter malhas nomeadas Headlight / Headlamp / DRL';}
    }
    function toggleHeadlights(){
      if(!headlightMaterials.length)return;
      headlightsOn=!headlightsOn;
      for(const mat of headlightMaterials)mat.emissiveIntensity=headlightsOn?2.4:0;
      lightsBtn?.setAttribute('aria-pressed',String(headlightsOn));
      if(lightsBtn)lightsBtn.textContent=headlightsOn?'◉ Faróis ON':'◌ Faróis OFF';
    }
    lightsBtn?.addEventListener('click',toggleHeadlights);
    // A cor da carroceria é alterada somente quando o arquivo possui um material de pintura identificável.
    // Controle manual para arquivos de terceiros cujos materiais não seguem
    // nomes previsíveis. Nada disso altera o arquivo GLB salvo no GitHub.
    function populateMaterials(root) {
      materialTargets=[];
      const used=new Set();
      root.traverse(mesh=>{
        if(!mesh.isMesh||!mesh.material)return;
        const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
        for(const material of materials){
          if(!material||used.has(material.uuid))continue;
          used.add(material.uuid);
          materialTargets.push({material,name:(material.name||'Material sem nome')+' — '+(mesh.name||'Peça sem nome')});
        }
      });
      if(!materialSelect)return;
      materialSelect.replaceChildren(new Option('Selecione um material…',''));
      materialTargets.forEach((entry,index)=>materialSelect.add(new Option(entry.name,String(index))));
      const idx=materialTargets.findIndex(entry=>/car.?paint|body.?paint|paintwork|carroceria/i.test(entry.name));
      if(idx>=0)materialSelect.value=String(idx);
    }
    function chosenMaterial(){
      if(!materialSelect||materialSelect.value==='')return null;
      const index=Number(materialSelect.value);
      return Number.isInteger(index)?materialTargets[index]?.material||null:null;
    }
    blackBtn?.addEventListener('click',()=>{
      const mat=chosenMaterial();
      if(!mat||!mat.color){say('Selecione primeiro um material da carroceria na lista.');return;}
      mat.color.set('#0b1013');
      if('metalness' in mat)mat.metalness=.7;
      if('roughness' in mat)mat.roughness=.19;
      mat.needsUpdate=true;
      say('Material de teste pintado de preto. Para manter a cor no site, altere essa peça no Blender e exporte novamente.');
    });
    setHeadlampBtn?.addEventListener('click',()=>{
      const mat=chosenMaterial();
      if(!mat||!mat.isMeshStandardMaterial){say('Selecione um material compatível com iluminação emissiva.');return;}
      mat.color.set('#f2faff');
      mat.emissive.set('#e8f5ff');
      mat.emissiveIntensity=2.4;
      mat.needsUpdate=true;
      if(!headlightMaterials.includes(mat))headlightMaterials.push(mat);
      headlightsOn=true;
      if(lightsBtn){
        lightsBtn.disabled=false;
        lightsBtn.textContent='◉ Faróis ON';
        lightsBtn.setAttribute('aria-pressed','true');
      }
      say('Material aceso na prévia. Confira se selecionou realmente os faróis; o ajuste definitivo deve ser feito no Blender.');
    });
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
    async function loadModel(source, label, objectURL=false, kind='car') {
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
        const scale=(kind==='battery'?1.3:4.85)/longest;
        model.scale.setScalar(scale);
        const box=new THREE.Box3().setFromObject(model);
        const midpoint=box.getCenter(new THREE.Vector3());
        model.position.set(-midpoint.x,(kind==='battery'?.15:.085)-box.min.y,-midpoint.z);
        optionalDarkPaint(model);
        prepareHeadlights(model);
        populateMaterials(model);
        model.traverse(obj=>{
          if(obj.isMesh){obj.castShadow=true;obj.receiveShadow=true;}
        });
        rig.add(model);currentAsset=model;
        currentKind=kind;
        // Convenção para arquivos preparados no Blender: criar o objeto Hood_Pivot
        // com origem na dobradiça do capô, sem aplicar a abertura previamente.
        hoodPivot=kind==='car'?(model.getObjectByName('Hood_Pivot')||null):null;
        hoodInitialX=hoodPivot?hoodPivot.rotation.x:0;
        hoodMotion=null;
        hoodIsOpen=false;
        if(hoodBtn){hoodBtn.disabled=!hoodPivot;hoodBtn.textContent='⌃ Abrir capô';hoodBtn.title=hoodPivot?'Abrir o capô articulado':'Este modelo ainda não possui Hood_Pivot no Blender';}
        if(lightsBtn){lightsBtn.textContent='◉ Faróis ON';lightsBtn.setAttribute('aria-pressed','true');headlightsOn=true;}
        rig.rotation.set(0,-Math.PI*.13,0);
        controls.minDistance=kind==='battery'?1.65:5.4;
        controls.maxDistance=kind==='battery'?7.2:13.2;
        camera.position.set(...(kind==='battery'?[2.3,1.8,2.9]:[6.8,3.3,8.3]));
        controls.target.set(0,kind==='battery'?.45:.9,0);
        controls.update();transition=null;
        spinning=!reduce.matches;updateSpinButton();
        ready=true;setUIState('loaded');
        if(hoodBtn)hoodBtn.disabled=!hoodPivot;
        if(lightsBtn)lightsBtn.disabled=headlightMaterials.length===0;
        const lightNote=headlightMaterials.length?' Faróis identificados e ligados.':' Faróis reais dependem de materiais identificados no GLB.';
        say((kind==='battery'?'Bateria':'Carro')+' 3D local carregado! Arraste para girar e aproxime.'+(kind==='car'?lightNote:''));
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
      if(hoodPivot){hoodPivot.rotation.x=hoodInitialX;hoodMotion=null;hoodIsOpen=false;}
      if(hoodBtn)hoodBtn.textContent='⌃ Abrir capô';
      rig.rotation.y=-Math.PI*.13;
      moveCamera(currentKind==='battery'?[2.3,1.8,2.9]:[6.8,3.3,8.3],[0,currentKind==='battery'?.45:.9,0]);
      spinning=!reduce.matches;updateSpinButton();
    }
    pauseBtn?.addEventListener('click',()=>{
      spinning=!spinning;
      updateSpinButton();run();
    });
    resetBtn?.addEventListener('click',resetCamera);
    hoodBtn?.addEventListener('click',()=>{
      if(!hoodPivot)return;
      spinning=false;updateSpinButton();
      hoodIsOpen=!hoodIsOpen;
      hoodMotion={start:performance.now(),duration:1250,from:hoodPivot.rotation.x,to:hoodInitialX+(hoodIsOpen?-1.06:0)};
      if(hoodBtn)hoodBtn.textContent=hoodIsOpen?'⌄ Fechar capô':'⌃ Abrir capô';
      if(hoodIsOpen)moveCamera([3.3,2.45,5.1],[0,1.15,.1],1250);
      else moveCamera([6.8,3.3,8.3],[0,.9,0],1250);
      say(hoodIsOpen?'Abrindo peça real Hood_Pivot.':'Fechando o capô.');
    });
    frontBtn?.addEventListener('click',()=>{
      spinning=false;updateSpinButton();
      // Orienta o carro para enquadramento de inspeção frontal.
      moveCamera([0,2.5,8],[0,.85,0]);
    });
    form?.addEventListener('submit',()=>{
      if(!form.reportValidity()||!ready)return;
      if(currentKind==='battery'){
        say('Você está inspecionando um GLB de bateria. Para ver a aproximação e o capô, carregue um GLB de carro.');
        return;
      }
      spinning=false;updateSpinButton();
      // Primeira parte cinematográfica: câmera aproxima; se o GLB já tiver
      // Hood_Pivot, o capô se abre no mesmo clique. Sem Hood_Pivot não criamos capô falso.
      moveCamera([3.4,2.25,5.6],[0,1.03,.1],1500);
      if(hoodPivot){
        hoodIsOpen=true;
        if(hoodBtn)hoodBtn.textContent='⌄ Fechar capô';
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
      loadModel(url,file.name,true,assetType?.value==='battery'?'battery':'car');
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
    loadModel(DEMO_MODEL,'sport-sedan.glb (seu GitHub)');
  }catch(e){
    console.error('Falha ao iniciar o visualizador 3D:',e);
    setUIState('fallback');
    say('Não foi possível iniciar WebGL neste navegador. A apresentação em imagem está disponível.');
  }
}
