(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const wa = '5561995191090';
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  // O hero possui sua própria navegação; páginas internas usam apenas este módulo.
  if (!$('.pb-hero')) {
    const menu = $('#pbMenu');
    const nav = $('#pbNav');
    const close = () => {
      nav?.classList.remove('open');
      menu?.setAttribute('aria-expanded', 'false');
      menu?.setAttribute('aria-label', 'Abrir menu');
    };
    menu?.addEventListener('click', () => {
      const next = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(next));
      menu.setAttribute('aria-label', next ? 'Fechar menu' : 'Abrir menu');
      nav?.classList.toggle('open', next);
    });
    nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') close();
    });
  }
  function openWhatsApp(message) {
    window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(message),
      '_blank', 'noopener,noreferrer');
  }

  const sosForm = $('#v7SosForm');
  sosForm?.addEventListener('submit', event => {
    event.preventDefault();
    const vehicle = $('#v7SosVehicle')?.value.trim() || 'Não informado';
    const issue = $('#v7SosIssue')?.value || 'Não informado';
    const region = $('#v7SosRegion')?.value.trim() || 'Não informado';
    openWhatsApp('Olá, Power Baterias! Gostaria de consultar a visita técnica/diagnóstico divulgado por R$ 100.\n\nVeículo: '
      + vehicle + '\nSituação: ' + issue + '\nRegião: ' + region
      + '\n\nPodem confirmar cobertura, disponibilidade, preço e condições antes do atendimento?');
  });

  // Consulta demonstrativa de seleção, sem motor de compatibilidade inventado.
  const gForm = $('#v7GarageForm'), gBrand = $('#v7GarageBrand'), gModel = $('#v7GarageModel');
  const models = {
    Chevrolet: ['Celta', 'Onix', 'Prisma', 'Corsa', 'Classic'],
    Fiat: ['Uno', 'Palio', 'Argo', 'Mobi'],
    Volkswagen: ['Gol', 'Polo', 'Fox', 'Voyage'],
    Ford: ['Ka', 'Fiesta'],
    Honda: ['Civic', 'Fit', 'City'],
    Toyota: ['Corolla', 'Etios']
  };
  gBrand?.addEventListener('change', () => {
    gModel.replaceChildren(new Option(gBrand.value ? 'Selecione o modelo' : 'Escolha uma marca', ''));
    (models[gBrand.value] || []).forEach(name => gModel.add(new Option(name, name)));
    gModel.disabled = !gBrand.value;
    $('#v7GarageResult')?.classList.remove('is-visible');
  });
  gForm?.addEventListener('submit', event => {
    event.preventDefault();
    if (!gForm.reportValidity()) return;
    const selection = [
      gBrand.value, gModel.value, $('#v7GarageYear')?.value || '',
      $('#v7GarageVersion')?.value.trim() || 'Versão não informada'
    ].join(' • ');
    const status = $('#v7GarageResult');
    const text = $('#v7GarageSummary');
    if (text) text.textContent = selection;
    if (status) status.classList.add('is-visible');
  });
  $('#v7GarageWhatsapp')?.addEventListener('click', () => {
    const selection = $('#v7GarageSummary')?.textContent || 'Veículo não informado';
    openWhatsApp('Olá, Power Baterias! Quero confirmar a bateria indicada para meu veículo.\n\n'
      + 'Veículo: ' + selection + '\n\nPodem verificar modelos Heliar e Moura compatíveis, disponibilidade e orçamento?');
  });
  document.querySelectorAll('[data-v7-whatsapp]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const topic = link.dataset.v7Whatsapp || 'atendimento';
      openWhatsApp('Olá, Power Baterias! Vi ' + topic
        + ' no site e gostaria de consultar disponibilidade, aplicação e orçamento.');
    });
  });
})();