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

  replay?.addEventListener('click', replayLighting);
  reducedMotion.addEventListener?.('change', replayLighting);
  replayLighting();

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
