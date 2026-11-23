(() => {
  const stage = document.querySelector('.pb-hero');
  if (!stage) return;
  const barSet = [...document.querySelectorAll('.pb-progress-bars i')];
  const progress = document.getElementById('pbProgressNumber');
  const replay = document.getElementById('pbReplay');
  const menu = document.getElementById('pbMenu');
  const nav = document.getElementById('pbNav');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let phaseTimers = [];
  let obs;
  const setPhase = (step) => {
    stage.dataset.drivePhase = String(step);
    if (progress) progress.textContent = String(step + 1).padStart(2, '0') + ' / 03';
    barSet.forEach((bar, i) => bar.classList.toggle('on', i <= step));
  };
  function start() {
    phaseTimers.forEach(clearTimeout);
    phaseTimers = [];
    if (reduce.matches) { setPhase(2); return; }
    setPhase(0);
    phaseTimers.push(setTimeout(() => setPhase(1), 1600));
    phaseTimers.push(setTimeout(() => setPhase(2), 3650));
  }
  replay?.addEventListener('click', start);
  start();
  if ('IntersectionObserver' in window) {
    obs = new IntersectionObserver(([entry]) => {
      stage.classList.toggle('pb-out-of-view', !entry.isIntersecting);
    }, {threshold:0.05});
    obs.observe(stage);
  }
  document.addEventListener('visibilitychange', () => {
    stage.classList.toggle('pb-page-hidden', document.hidden);
  });
  reduce.addEventListener?.('change', start);
  menu?.addEventListener('click', () => {
    const expanded = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(expanded));
    nav?.classList.toggle('open', expanded);
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false');
  }));
})();
