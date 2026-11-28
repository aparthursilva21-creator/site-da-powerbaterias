import { site } from './config.mjs';
export { site };

export const escape = (value = '') => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

export const wa = (message = 'Olá! Gostaria de atendimento da Power Baterias.') =>
  `${site.whatsappUrl}?text=${encodeURIComponent(message)}`;

export function action(href, label, { variant = 'primary', external = false, icon: symbol } = {}) {
  return `<a class="button button--${escape(variant)}" href="${escape(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${symbol ? icon(symbol) : ''}${escape(label)}</a>`;
}

export function intro(kicker, title, description) {
  return `<section class="page-intro"><div class="wrap"><p class="kicker">${escape(kicker)}</p><h1>${escape(title)}</h1>${description ? `<p class="lede">${escape(description)}</p>` : ''}</div></section>`;
}

export function photo(src, alt, { className = '', width, height, sizes, srcset, eager = false } = {}) {
  return `<img class="${escape(className)}" src="${escape(src)}" alt="${escape(alt)}"${width ? ` width="${width}"` : ''}${height ? ` height="${height}"` : ''}${srcset ? ` srcset="${escape(srcset)}"` : ''}${sizes ? ` sizes="${escape(sizes)}"` : ''} loading="${eager ? 'eager' : 'lazy'}" decoding="async">`;
}

const icons = {
  bolt: '<path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z"/>',
  pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  battery: '<rect x="3" y="7" width="17" height="11" rx="2"/><path d="M21 11h1v3h-1M6 12.5h4m4 0h3m-1.5-1.5v3"/>',
  menu: '<path d="M3 7h18M3 12h18M3 17h18"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  wrench: '<path d="M14 6a5 5 0 0 0-6 6l-5 5a2 2 0 0 0 3 3l5-5a5 5 0 0 0 6-6l-3 3-3-3 3-3Z"/>',
  shield: '<path d="m12 3 8 3v5c0 5-3 8-8 10-5-2-8-5-8-10V6l8-3Z"/><path d="m8 12 2 2 5-5"/>',
  phone: '<path d="M7 3H4a1 1 0 0 0-1 1c0 9 8 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2a16 16 0 0 1-7-7l2-2-2-5Z"/>',
  whatsapp: '<path fill="currentColor" stroke="none" d="M20.52 3.48A11.87 11.87 0 0 0 12.1 0C5.54 0 .2 5.34.2 11.9c0 2.1.54 4.15 1.58 5.96L.1 24l6.29-1.65a11.87 11.87 0 0 0 5.7 1.45h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.48-8.42ZM12.1 21.79h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.73.98 1-3.64-.24-.38A9.88 9.88 0 0 1 2.2 11.9C2.2 6.45 6.64 2.01 12.1 2.01a9.82 9.82 0 0 1 7 2.9 9.83 9.83 0 0 1 2.9 7c0 5.45-4.44 9.89-9.9 9.89Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z"/>'
};
export const icon = (name) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] ?? icons.bolt}</svg>`;
