/* POWER GARAGE V01. Never assert real vehicle/battery compatibility. */
(() => {
  'use strict';
  const root = document.getElementById('garagem');
  if (!root) return;
  const PHONE='5561995191090';
  const $ = s => root.querySelector(s);
  const $$ = s => [...root.querySelectorAll(s)];
  const cars = {
    Chevrolet:['Celta','Onix','Prisma','Corsa','Classic'],
    Fiat:['Uno','Palio','Argo','Mobi'],
    Volkswagen:['Gol','Polo','Fox','Voyage'],
    Ford:['Ka','Fiesta'],
    Honda:['Civic','Fit','City'],
    Toyota:['Corolla','Etios']
  };
  const products = {
    heliar:{name:'Heliar 60Ah',brand:'HELIAR',ah:'60Ah'},
    moura:{name:'Moura 60Ah',brand:'MOURA',ah:'60Ah'},
    heavy:{name:'Bateria superdimensionada (demonstração)',brand:'LINHA PESADA',ah:'ILUSTRATIVO'}
  };
  const brand=$('#pgBrand'),model=$('#pgModel'),year=$('#pgYear'),engine=$('#pgEngine');
  const form=$('#pgVehicleForm'),summary=$('#pgSummary'),screen=$('#pgEngineScreen');
  const caption=$('#pgCarCaption'),specVehicle=$('#pgSpecVehicle');
  const visualTitle=$('#pgVisualTitle'),visualDesc=$('#pgVisualDesc');
  const inserted=$('#pgInsertedBattery'),insertedBrand=$('#pgInsertedBrand');
  const result=$('#pgResult'),resultTitle=$('#pgResultTitle'),resultDesc=$('#pgResultDescription'),resultIcon=$('#pgResultIcon');
  const inspectButton=$('#pgInspect'),inspector=$('#pgInspector'),inspectorClose=$('#pgInspectorClose');
  const inspectorTitle=$('#pgInspectorTitle'),inspectorBrandFront=$('#pgInspectorBrandFront');
  const inspectorAhFront=$('#pgInspectorAhFront'),inspectorAh=$('#pgInspectorAh');
  const rotatable=$('#pgRotatableBattery'),orbit=$('#pgInspectorOrbit');
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  let vehicle=null,selectedProduct=null,rotationY=-27,rotationX=-14;
  const scrollToBlock = (element,position='start')=>element?.scrollIntoView({behavior:reduce.matches?'auto':'smooth',block:position});

  if(year)for(let y=new Date().getFullYear();y>=1995;y--)year.add(new Option(String(y),String(y)));
  const vehicleLabel=()=>vehicle?[vehicle.brand,vehicle.model,vehicle.year,vehicle.engine].filter(Boolean).join(' • '):'';

  function resetResult(type='idle'){
    result.dataset.result=type;
    if(type==='idle'){
      resultIcon.textContent='◎';resultTitle.textContent='PRONTO PARA TESTAR?';
      resultDesc.textContent=vehicle
        ?'Agora escolha uma bateria para visualizar o encaixe ilustrativo. Isso ainda não comprova compatibilidade.'
        :'Selecione seu veículo e experimente uma das baterias. O resultado ainda não é uma verificação técnica real.';
      inspectButton.disabled=true;
    }else if(type==='warning'){
      resultIcon.textContent='×';resultTitle.textContent='NÃO ENCAIXA NESTA SIMULAÇÃO.';
      resultDesc.textContent='A bateria superdimensionada excede a área representada. O desenho NÃO determina a compatibilidade de baterias reais; consulte um especialista da Power.';
      inspectButton.disabled=true;
    }else{
      resultIcon.textContent='↘';resultTitle.textContent='ENCAIXE VISUAL REALIZADO.';
      resultDesc.textContent='A '+products[selectedProduct].name+' foi posicionada apenas no protótipo. Antes de indicar a bateria correta, precisamos conferir medidas, polo, corrente de partida e tecnologia exigida.';
      inspectButton.disabled=false;
    }
  }
  function invalidateVehicle(){
    vehicle=null;selectedProduct=null;
    screen.dataset.state='waiting';
    summary.classList.remove('is-selected');
    summary.replaceChildren();
    const dot=document.createElement('span');dot.className='pg-summary-pulse';
    summary.append(dot,document.createTextNode(' CONFIRME OS DADOS DO VEÍCULO PARA AVANÇAR'));
    caption.textContent='ESCOLHA UM CARRO';
    specVehicle.textContent='NÃO SELECIONADO';
    visualTitle.textContent='SEU COFRE, MAIS DE PERTO.';
    visualDesc.textContent='A experiência final mostrará imagens ou modelos reais do compartimento correspondente ao carro selecionado.';
    inserted.className='pg-inserted-battery';
    $$('.pg-product-card').forEach(el=>el.setAttribute('aria-pressed','false'));
    resetResult();
  }
  brand?.addEventListener('change',()=>{
    model.replaceChildren(new Option(brand.value?'Selecione o modelo':'Escolha uma marca',''));
    (cars[brand.value]||[]).forEach(name=>model.add(new Option(name,name)));
    model.disabled=!brand.value;
    invalidateVehicle();
  });
  [model,year,engine].forEach(el=>el?.addEventListener('change',invalidateVehicle));
  $('#pgStart')?.addEventListener('click',()=>scrollToBlock($('#pgLab'),'center'));

  form?.addEventListener('submit',event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    vehicle={brand:brand.value,model:model.value,year:year.value,engine:engine.value};
    selectedProduct=null;
    const label=vehicleLabel();
    screen.dataset.state='ready';
    inserted.className='pg-inserted-battery';
    $$('.pg-product-card').forEach(el=>el.setAttribute('aria-pressed','false'));
    summary.classList.add('is-selected');
    summary.replaceChildren();
    const dot=document.createElement('span');dot.className='pg-summary-pulse';
    summary.append(dot,document.createTextNode(' VEÍCULO SELECIONADO: '+label.toUpperCase()));
    caption.textContent=label.toUpperCase();
    specVehicle.textContent=label;
    visualTitle.textContent='AGORA VAMOS OLHAR POR DENTRO.';
    visualDesc.textContent='Esta é uma vista conceitual de laboratório. O cofre exato do veículo será mostrado após incluirmos imagens técnicas validadas.';
    resetResult();
    scrollToBlock($('#pgEngineSection'));
  });

  $$('.pg-product-card').forEach(button=>button.addEventListener('click',()=>{
    if(!vehicle){
      summary.classList.remove('is-selected');
      summary.replaceChildren();
      const dot=document.createElement('span');dot.className='pg-summary-pulse';
      summary.append(dot,document.createTextNode(' SELECIONE MARCA, MODELO, ANO E MOTORIZAÇÃO PRIMEIRO.'));
      scrollToBlock($('#pgLab'),'center');
      return;
    }
    selectedProduct=button.dataset.pgProduct;
    if(!products[selectedProduct])return;
    $$('.pg-product-card').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));
    inserted.className='pg-inserted-battery';
    insertedBrand.textContent=products[selectedProduct].brand;
    void inserted.offsetWidth;
    inserted.classList.add(selectedProduct==='heavy'?'is-large':'is-dropping');
    resetResult(selectedProduct==='heavy'?'warning':'preview');
    scrollToBlock($('#pgEngineSection'),'center');
  }));

  function whatsapp(){
    const text=[
      'Olá, Power Baterias! Usei a Power Garage e gostaria de uma indicação técnica.',
      '',
      'Veículo: '+(vehicle?vehicleLabel():'Ainda não selecionei meu veículo.'),
      'Modelo visualizado: '+(selectedProduct?products[selectedProduct].name:'Ainda não escolhi uma bateria.'),
      '',
      'Sei que a simulação do site é ilustrativa. Poderiam conferir a compatibilidade real, disponibilidade e orçamento?'
    ].join('\n');
    window.open('https://wa.me/'+PHONE+'?text='+encodeURIComponent(text),'_blank','noopener,noreferrer');
  }
  $('#pgWhatsApp')?.addEventListener('click',whatsapp);
  $('#pgInspectorWhatsApp')?.addEventListener('click',whatsapp);

  function rotate(){
    if(!rotatable)return;
    rotatable.style.transform=(window.innerWidth<=620?'scale(.78) ':'')+'rotateX('+rotationX+'deg) rotateY('+rotationY+'deg)';
  }
  $('#pgRotateLeft')?.addEventListener('click',()=>{rotationY-=30;rotate();});
  $('#pgRotateRight')?.addEventListener('click',()=>{rotationY+=30;rotate();});
  window.addEventListener('resize',()=>{if(inspector?.open)rotate();});
  if(orbit){
    let previousX=null,previousY=null;
    orbit.style.touchAction='none';
    orbit.addEventListener('pointerdown',e=>{
      if(!inspector?.open)return;
      previousX=e.clientX;previousY=e.clientY;
      orbit.setPointerCapture?.(e.pointerId);
    });
    orbit.addEventListener('pointermove',e=>{
      if(previousX===null)return;
      rotationY+=(e.clientX-previousX)*.48;
      rotationX=Math.max(-70,Math.min(65,rotationX-(e.clientY-previousY)*.25));
      previousX=e.clientX;previousY=e.clientY;rotate();
    });
    const end=()=>{previousX=null;previousY=null;};
    orbit.addEventListener('pointerup',end);
    orbit.addEventListener('pointercancel',end);
  }
  inspectButton?.addEventListener('click',()=>{
    if(!selectedProduct||selectedProduct==='heavy')return;
    const product=products[selectedProduct];
    inspectorTitle.textContent=product.name;
    inspectorBrandFront.textContent=product.brand;
    inspectorAhFront.textContent=product.ah;
    inspectorAh.textContent=product.ah+' (exemplo de linha)';
    rotationY=-27;rotationX=-14;rotate();
    if(typeof inspector.showModal==='function')inspector.showModal();
    else inspector.setAttribute('open','');
  });
  inspectorClose?.addEventListener('click',()=>{
    if(typeof inspector.close==='function')inspector.close();
    else inspector.removeAttribute('open');
  });
  inspector?.addEventListener('click',e=>{
    if(e.target===inspector){
      if(typeof inspector.close==='function')inspector.close();
      else inspector.removeAttribute('open');
    }
  });
})();