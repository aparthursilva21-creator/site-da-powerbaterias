const section = document.querySelector('[data-battery]');

if (section) {
  const stage = section.querySelector('.battery-stage');
  const destination = section.querySelector('.battery-canvas');
  const status = section.querySelector('.battery-status');
  const load = section.querySelector('[data-battery-load]');
  const controls = section.querySelector('.battery-interaction');
  const scroll = section.querySelector('[data-battery-scroll]');
  const slider = section.querySelector('input[type="range"]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');

  const updateSlider = value => {
    slider.value = Math.round(value * 100);
    const label = value === 0 ? 'Montada' : value === 1 ? 'Peças separadas' : `${slider.value}% de separação`;
    slider.setAttribute('aria-valuetext', label);
  };

  load.hidden = false;
  load.addEventListener('click', async () => {
    load.disabled = true;
    status.textContent = 'Carregando visualização…';
    try {
      const { setupBattery } = await import('./battery-scene.js');
      const experience = setupBattery(destination, section, updateSlider, () => {
        stage.classList.remove('battery-stage--loaded');
        controls.hidden = true;
        load.hidden = false;
        load.disabled = false;
        status.textContent = 'Visualização 3D interrompida. A imagem e a descrição continuam disponíveis.';
      });
      stage.classList.add('battery-stage--loaded');
      status.textContent = '';
      controls.hidden = false;
      load.hidden = true;

      const signal = new AbortController();
      const setScroll = enabled => {
        const active = enabled && !motion.matches;
        scroll.setAttribute('aria-pressed', String(active));
        experience.followScroll(active);
      };
      scroll.hidden = motion.matches;
      setScroll(true);
      slider.focus({ preventScroll: true });

      scroll.addEventListener('click', () => setScroll(scroll.getAttribute('aria-pressed') !== 'true'), { signal: signal.signal });
      slider.addEventListener('input', () => {
        setScroll(false);
        const value = Number(slider.value) / 100;
        updateSlider(value);
        experience.setPosition(value);
      }, { signal: signal.signal });
      motion.addEventListener('change', () => {
        scroll.hidden = motion.matches;
        if (motion.matches) setScroll(false);
      }, { signal: signal.signal });
      destination.addEventListener('battery-webgl-lost', () => signal.abort(), { once: true });
      window.addEventListener('pagehide', event => {
        if (!event.persisted) {
          experience.dispose();
          signal.abort();
        }
      }, { signal: signal.signal });
    } catch {
      status.textContent = 'A visualização 3D está indisponível neste dispositivo. Consulte a descrição das peças ao lado da imagem.';
      load.disabled = false;
    }
  });
}
