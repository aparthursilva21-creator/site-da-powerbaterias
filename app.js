(() => {
  'use strict';
  const PHONE = '5561995191090';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const whatsapp = (message) => {
    const url = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Navegação responsiva
  const menu = $('#menuButton');
  const nav = $('#nav');
  if (menu && nav) {
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      nav.classList.toggle('open', open);
    });
    $$('#nav a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      menu.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-label', 'Abrir menu');
    }));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        nav.classList.remove('open');
        menu.setAttribute('aria-expanded', 'false');
      }
    });
  }
  const yearElement = $('#year');
  if (yearElement) yearElement.textContent = new Date().getFullYear();

  // Cena cinematográfica: falha -> entrega -> instalação -> partida.
  const scene = $('#scene');
  const sceneMessage = $('#sceneMessage');
  const sceneCount = $('#sceneCount');
  const replay = $('#replay');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phases = [
    { stage: 'off', label: 'FALHA NA PARTIDA...', count: '01 / 06', duration: 2400 },
    { stage: 'call', label: 'CHAMANDO A POWER...', count: '02 / 06', duration: 2400 },
    { stage: 'arrive', label: 'MOTOQUEIRO A CAMINHO', count: '03 / 06', duration: 3000 },
    { stage: 'install', label: 'INSTALANDO A BATERIA', count: '04 / 06', duration: 3700 },
    { stage: 'depart', label: 'ATENDIMENTO CONCLUÍDO', count: '05 / 06', duration: 2500 },
    { stage: 'drive', label: 'ENERGIA PARA SEGUIR!', count: '06 / 06', duration: 0 }
  ];
  let phaseTimer = null;
  let phaseIndex = 0;
  const applyPhase = (index) => {
    if (!scene) return;
    const phase = phases[index];
    scene.dataset.stage = phase.stage;
    sceneMessage.textContent = phase.label;
    sceneCount.textContent = phase.count;
    $$('.scene-timeline [data-phase]').forEach(item => {
      item.classList.toggle('current', item.dataset.phase === phase.stage);
    });
  };
  const nextPhase = () => {
    if (phaseIndex >= phases.length - 1) return;
    phaseIndex++;
    applyPhase(phaseIndex);
    if (phaseIndex < phases.length - 1) phaseTimer = window.setTimeout(nextPhase, phases[phaseIndex].duration);
  };
  const startScene = () => {
    window.clearTimeout(phaseTimer);
    phaseIndex = reducedMotion ? phases.length - 1 : 0;
    applyPhase(phaseIndex);
    if (!reducedMotion) phaseTimer = window.setTimeout(nextPhase, phases[phaseIndex].duration);
  };
  if (scene) {
    startScene();
    replay?.addEventListener('click', startScene);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) window.clearTimeout(phaseTimer);
      else startScene();
    });
  }

  // Garagem: interface conceitual. Não representa compatibilidade técnica.
  const models = {
    Chevrolet: ['Celta', 'Onix', 'Prisma', 'Corsa'],
    Honda: ['Civic', 'Fit', 'City', 'HR-V'],
    Volkswagen: ['Gol', 'Polo', 'Fox', 'Voyage'],
    Fiat: ['Uno', 'Palio', 'Argo', 'Mobi']
  };
  const brand = $('#carBrand');
  const model = $('#carModel');
  const year = $('#carYear');
  const selectedCar = $('#selectedCar');
  const battery = $('#garageBattery');
  const compatTitle = $('#compatibilityTitle');
  const compatText = $('#compatibilityText');
  const compatIcon = $('#compatibilityIcon');
  let pickedBattery = '';
  if (year) {
    for (let y = new Date().getFullYear(); y >= 1995; y--) {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = String(y);
      year.appendChild(opt);
    }
  }
  const description = () => [brand?.value, model?.value, year?.value].filter(Boolean).join(' ') || 'ESCOLHA SEU VEÍCULO';
  const setVehicleTitle = () => { if (selectedCar) selectedCar.textContent = description().toUpperCase(); };
  if (brand && model) {
    brand.addEventListener('change', () => {
      model.replaceChildren(new Option('Selecione o modelo', ''));
      (models[brand.value] || []).forEach(name => model.add(new Option(name, name)));
      model.disabled = !brand.value;
      setVehicleTitle();
      setCompatStatus();
    });
    model.addEventListener('change', () => { setVehicleTitle(); setCompatStatus(); });
    year?.addEventListener('change', () => { setVehicleTitle(); setCompatStatus(); });
  }
  const sizeLabel = { compacta: 'compacto', padrao: 'padrão', grande: 'grande' };
  function setCompatStatus() {
    if (!compatTitle || !compatText || !compatIcon) return;
    if (!pickedBattery) {
      compatTitle.textContent = 'PRONTO PARA EXPERIMENTAR';
      compatText.textContent = 'Escolha um veículo e um tamanho para experimentar o encaixe visual.';
      compatIcon.textContent = '◎';
      return;
    }
    compatTitle.textContent = 'VISUALIZAÇÃO DE TAMANHO ' + sizeLabel[pickedBattery].toUpperCase();
    compatIcon.textContent = '✓';
    const car = brand?.value && model?.value ? ' no ' + description() : '';
    compatText.textContent = 'Este é apenas um encaixe ilustrativo' + car + '. Consulte nossa equipe para saber quais modelos são realmente compatíveis.';
  }
  $$('.battery-choice').forEach(button => {
    button.addEventListener('click', () => {
      pickedBattery = button.dataset.size || '';
      $$('.battery-choice').forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      if (battery) {
        battery.className = 'battery-3d';
        // Força uma nova transição para o movimento de encaixe.
        void battery.offsetHeight;
        battery.classList.add('show');
        if (pickedBattery === 'compacta') battery.classList.add('is-small');
        if (pickedBattery === 'grande') battery.classList.add('is-large');
      }
      setCompatStatus();
    });
  });
  $('#garageContact')?.addEventListener('click', () => {
    const vehicle = description() === 'ESCOLHA SEU VEÍCULO' ? 'não informado' : description();
    const size = pickedBattery ? sizeLabel[pickedBattery] : 'não selecionado';
    whatsapp('Olá, Power Baterias! Usei a garagem virtual do site e gostaria de CONFIRMAR a bateria adequada para meu veículo.\n\nVeículo: ' + vehicle + '\nTamanho visual experimentado: ' + size + '\n\nPodem me orientar sobre compatibilidade, disponibilidade e orçamento?');
  });

  // Catálogo: nenhuma compra ou preço no site.
  $$('[data-product]').forEach(button => {
    button.addEventListener('click', () => {
      whatsapp('Olá, Power Baterias! Vi a ' + button.dataset.product + ' no site. Gostaria de consultar aplicação, disponibilidade e solicitar orçamento.');
    });
  });

  // SOS: mensagem preparada no navegador, sem coleta/armazenamento.
  $('#sosForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const vehicle = $('#sosVehicle')?.value.trim() || 'Não informado';
    const issue = $('#sosIssue')?.value || 'Meu carro não liga';
    const where = $('#sosWhere')?.value.trim() || 'Não informado';
    whatsapp('Olá, Power Baterias! Quero consultar o SOCORRO com visita técnica e teste de bateria divulgado por R$ 100.\n\nVeículo: ' + vehicle + '\nSituação: ' + issue + '\nRegião: ' + where + '\n\nPodem confirmar disponibilidade, área atendida e condições do serviço antes de eu solicitar?');
  });
})();
