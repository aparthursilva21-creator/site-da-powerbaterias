const poster = document.querySelector('.hero-media img');
const progress = document.querySelector('.hero-load');
if (!poster.complete) {
  progress.hidden = false;
  const finish = () => { progress.hidden = true; };
  poster.addEventListener('load', finish, { once: true });
  poster.addEventListener('error', finish, { once: true });
}

const prefersMotion = matchMedia('(prefers-reduced-motion: no-preference)');
let motionRequested = false;
function startMotion() {
  if (motionRequested || !prefersMotion.matches) return;
  motionRequested = true;
  import('./home-motion.js').catch(() => {});
}
function scheduleMotion() {
  requestAnimationFrame(() => {
    if ('requestIdleCallback' in window) requestIdleCallback(startMotion, { timeout: 1300 });
    else setTimeout(startMotion, 300);
  });
}
if (document.readyState === 'complete') scheduleMotion();
else addEventListener('load', scheduleMotion, { once: true });
prefersMotion.addEventListener('change', () => {
  if (document.readyState === 'complete') scheduleMotion();
});

const video = document.querySelector('.hero-video');
const pause = document.querySelector('.hero-pause');
if (video && pause) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let ready = false;
  let pausedByUser = false;

  function prepareVideo() {
    if (ready) return;
    ready = true;
    const useMobile = matchMedia('(max-width: 680px)').matches;
    for (const format of ['webm', 'mp4']) {
      const mobileSource = video.dataset[`mobile${format === 'mp4' ? 'Mp4' : 'Webm'}`];
      const src = (useMobile && mobileSource) || video.dataset[format];
      if (!src) continue;
      const source = document.createElement('source');
      source.src = src;
      source.type = `video/${format}`;
      video.append(source);
    }
    video.load();
  }

  async function updateVideo() {
    if (reduced.matches || !visible || document.hidden || pausedByUser || navigator.connection?.saveData) {
      video.pause();
      video.classList.remove('is-playing');
      return;
    }
    prepareVideo();
    try {
      await video.play();
      if (reduced.matches || !visible || document.hidden || pausedByUser) {
        video.pause();
        return;
      }
      video.classList.add('is-playing');
      pause.hidden = false;
    } catch {
      video.classList.remove('is-playing');
      pause.hidden = true;
    }
  }

  pause.addEventListener('click', () => {
    pausedByUser = !pausedByUser;
    pause.textContent = pausedByUser ? 'Reproduzir vídeo' : 'Pausar vídeo';
    updateVideo();
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches) pause.hidden = true;
    updateVideo();
  });
  document.addEventListener('visibilitychange', updateVideo);
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updateVideo();
  }, { threshold: .2 });
  observer.observe(video.closest('.hero'));
}
