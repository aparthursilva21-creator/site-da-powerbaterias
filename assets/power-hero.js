(() => {
  'use strict';
  const stage = document.querySelector('.pb-hero');
  if (!stage) return;

  const bars = [...stage.querySelectorAll('.pb-progress-bars i')];
  const progress = document.getElementById('pbProgressNumber');
  const replay = document.getElementById('pbReplay');
  const menu = document.getElementById('pbMenu');
  const nav = document.getElementById('pbNav');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timers = [];

  // V05: os indicadores marcam apenas a evolução sutil da iluminação.
  // O automóvel, as rodas e o asfalto NÃO se movem.
  function setLightingState(index) {
    stage.dataset.drivePhase = String(index);
    if (progress) progress.textContent = String(index + 1).padStart(2, '0') + ' / 03';
    bars.forEach((bar, i) => bar.classList.toggle('on', i <= index));
  }

  function replayLighting() {
    timers.forEach(window.clearTimeout);
    timers = [];
    if (reducedMotion.matches) {
      setLightingState(2);
      return;
    }
    setLightingState(0);
    timers.push(window.setTimeout(() => setLightingState(1), 1650));
    timers.push(window.setTimeout(() => setLightingState(2), 3500));
  }

  // Abertura cinematográfica: logo e raio verde primeiro, depois revela o hero.
  // O botão "Pular" e a preferência por movimento reduzido não são bloqueados.
  const opening = document.getElementById('pbOpening');
  const skipOpening = document.getElementById('pbOpeningSkip');
  let openingTimer;
  let introFinished = false;

  function completeOpening() {
    if (!opening || introFinished) return;
    introFinished = true;
    window.clearTimeout(openingTimer);
    if (document.activeElement === skipOpening) skipOpening.blur();
    opening.classList.add('is-leaving');
    document.body.classList.remove('pb-opening-active');
    replayLighting();
    window.setTimeout(() => opening.remove(), 880);
  }

  function initializeOpening() {
    if (!opening) {
      replayLighting();
      return;
    }
    // Ao acessar diretamente uma seção via âncora, mostra o conteúdo sem atraso.
    const directSection = !!window.location.hash && window.location.hash !== '#inicio';
    if (reducedMotion.matches || directSection) {
      introFinished = true;
      opening.remove();
      replayLighting();
      return;
    }
    document.body.classList.add('pb-opening-active');
    setLightingState(0);
    openingTimer = window.setTimeout(completeOpening, 2070);
  }

  skipOpening?.addEventListener('click', completeOpening);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !introFinished) completeOpening();
  });
  replay?.addEventListener('click', replayLighting);
  reducedMotion.addEventListener?.('change', () => {
    if (reducedMotion.matches && !introFinished) completeOpening();
    else replayLighting();
  });
  initializeOpening();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      stage.classList.toggle('pb-out-of-view', !entry.isIntersecting);
    }, { threshold: 0.05 }).observe(stage);
  }
  document.addEventListener('visibilitychange', () => {
    stage.classList.toggle('pb-page-hidden', document.hidden);
  });

  function closeMenu() {
    nav?.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-label', 'Abrir menu');
  }
  menu?.addEventListener('click', () => {
    const expanded = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(expanded));
    menu.setAttribute('aria-label', expanded ? 'Fechar menu' : 'Abrir menu');
    nav?.classList.toggle('open', expanded);
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
})();
