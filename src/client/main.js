const header = document.querySelector('.site-header');
const menu = document.querySelector('[data-menu]');
const menuPanel = menu.closest('details');
const navigation = menuPanel.querySelector('nav');
const mobile = matchMedia('(max-width: 940px)');
if (document.querySelector('base')) {
  const skip = document.querySelector('.skip');
  skip.setAttribute('href', `${location.pathname}${location.search}#conteudo`);
}

function closeMenu({ restoreFocus = false } = {}) {
  menuPanel.open = false;
  if (restoreFocus) menu.focus();
}
function syncMenu() {
  menu.setAttribute('aria-expanded', String(menuPanel.open));
}
menuPanel.addEventListener('toggle', syncMenu);
syncMenu();
navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuPanel.open) closeMenu({ restoreFocus: true });
});
mobile.addEventListener('change', () => closeMenu());

function setScrolled() {
  header.classList.toggle('is-scrolled', scrollY > 10);
}
addEventListener('scroll', setScrolled, { passive: true });
setScrolled();

document.addEventListener('error', (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || image.dataset.failed) return;
  image.dataset.failed = 'true';
  if (!image.alt) {
    image.hidden = true;
    return;
  }
  const fallback = document.createElement('span');
  fallback.className = 'image-fallback';
  fallback.textContent = `Imagem indisponível · ${image.alt}`;
  image.replaceWith(fallback);
}, true);
