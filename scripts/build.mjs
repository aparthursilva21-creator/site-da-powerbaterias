import { createHash } from 'node:crypto';
import { access, cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { build } from 'esbuild';
import { action, escape, icon, site, wa } from '../src/shared.mjs';
import { pages as home } from '../src/pages/home.mjs';
import { pages as garage } from '../src/pages/garage.mjs';
import { pages as catalog } from '../src/pages/catalog.mjs';
import { pages as editorial } from '../src/pages/editorial.mjs';
import { pages as support } from '../src/pages/support.mjs';

const output = new URL('../dist/', import.meta.url);
const fromRoot = (path) => new URL(`../${path}`, import.meta.url);
const origin = new URL(process.env.POWER_SITE_URL || site.canonicalOrigin);
if (origin.protocol !== 'https:' || origin.search || origin.hash || !origin.pathname.endsWith('/')) {
  throw new Error('POWER_SITE_URL deve usar HTTPS e terminar com /. Exemplo: https://www.exemplo.com.br/');
}
const rel = (path) => `./${path}`;
const absolute = (path) => new URL(path === 'index.html' ? './' : path, origin).href;
const asset = (path) => `./assets/${path}`;
const assetAbsolute = (path) => new URL(path, origin).href;
const digest = (code) => `'sha256-${createHash('sha256').update(code).digest('base64')}'`;
const safeJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
const logo = (className = 'brand') => `<a class="${className}" href="./index.html"><img src="./assets/images/brand/power-logo-traced.svg" alt="Power Baterias — início" width="152" height="58"></a>`;

const nav = [
  ['index.html', 'Início'],
  ['power-garage.html', 'Power Garage'],
  ['baterias.html', 'Baterias'],
  ['servicos.html', 'Serviços'],
  ['sobre.html', 'Sobre'],
  ['contato.html', 'Contato']
];
const legal = [
  ['privacidade.html', 'Privacidade'],
  ['termos.html', 'Termos de uso'],
  ['garantias.html', 'Garantias, trocas e devoluções'],
  ['cookies.html', 'Cookies']
];

function links(items, current) {
  return items.map(([path, label]) => `<a href="${rel(path)}"${current === path ? ' aria-current="page"' : ''}>${label}</a>`).join('');
}

function header(page) {
  const active = page.path.startsWith('produto-') ? 'baterias.html' : page.path;
  const menuLinks = links(nav, active);
  return `<header class="site-header"><div class="wrap header-row">
    ${logo()}
    <nav class="site-nav" aria-label="Navegação principal">${menuLinks}</nav>
    <div class="header-actions">
      <a class="button header-sos" href="./power-sos.html"${page.path === 'power-sos.html' ? ' aria-current="page"' : ''}>${icon('bolt')} Power SOS</a>
      <details class="mobile-menu">
        <summary class="menu-toggle" data-menu aria-controls="site-mobile-nav" aria-label="Menu de navegação"><span class="menu-bars">${icon('menu')}</span><span class="menu-close">${icon('close')}</span></summary>
        <nav class="site-mobile-nav" id="site-mobile-nav" aria-label="Navegação principal">${menuLinks}</nav>
      </details>
    </div>
  </div></header>`;
}

function footer() {
  return `<footer class="site-footer"><div class="wrap">
    <div class="footer-grid">
      <div>${logo()}<p>Baterias automotivas, instalação e orientação especializada em Samambaia Norte, Brasília.</p></div>
      <nav aria-label="Explorar"><h2>Explorar</h2>${links([nav[1], nav[2], nav[3], ['conteudos.html', 'Central de conhecimento']])}</nav>
      <nav aria-label="Atendimento"><h2>Atendimento</h2>${links([['power-sos.html', 'Power SOS'], nav[4], nav[5]])}<a href="${escape(site.instagramUrl)}" target="_blank" rel="noopener noreferrer">Instagram</a></nav>
      <div><h2>Loja em Brasília</h2><address>${escape(site.address)}<br>CEP ${escape(site.postalCode)}</address><a href="${escape(site.whatsappUrl)}" target="_blank" rel="noopener noreferrer">WhatsApp · ${escape(site.phone)}</a></div>
    </div>
    <div class="footer-bottom"><p>© ${new Date().getUTCFullYear()} Power Baterias.</p><nav aria-label="Informações legais">${links(legal)}</nav></div>
  </div></footer>`;
}

const business = {
  '@context': 'https://schema.org',
  '@type': 'AutoPartsStore',
  name: site.name,
  url: origin.href,
  logo: assetAbsolute(asset('images/brand/power-logo-traced.svg')),
  telephone: site.phoneE164,
  sameAs: [site.instagramUrl],
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.streetAddress,
    addressLocality: 'Brasília',
    addressRegion: 'DF',
    postalCode: site.postalCode,
    addressCountry: 'BR'
  }
};

const githubBase = new URL(site.canonicalOrigin).pathname;
const errorBaseScript = `{const path=location.pathname;const base=document.createElement('base');const target=${safeJson(origin.pathname)};const github=${safeJson(githubBase)};base.href=target!=='/'&&path.startsWith(target)?target:path.startsWith(github)?github:'/';document.head.append(base);}`;

function render(page) {
  const isHome = page.path === 'index.html';
  const isError = page.path === '404.html';
  const pageImage = assetAbsolute(page.image || asset('images/hero.webp'));
  const schema = page.schema || (isHome ? business : null);
  const json = schema ? safeJson(schema) : null;
  const scripts = ["'self'", ...(isError ? [digest(errorBaseScript)] : []), ...(json ? [digest(json)] : [])].join(' ');
  const csp = `default-src 'self'; script-src ${scripts}; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self' data: blob:; media-src 'self'; frame-src https://maps.google.com https://www.google.com; form-action 'self' https://wa.me https://api.whatsapp.com https://www.whatsapp.com; base-uri 'self'; object-src 'none'; worker-src 'self' blob:`;
  const canonical = page.canonical || absolute(page.path);
  const floating = !page.noindex && !legal.some(([path]) => page.path === path);
  return `<!doctype html>
<html lang="pt-BR" data-whatsapp="${escape(site.whatsappUrl)}">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${escape(csp)}">
${isError ? `<script>${errorBaseScript}</script>` : ''}
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#050505">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${escape(page.title)}</title>
<meta name="description" content="${escape(page.description)}">
${page.noindex ? '<meta name="robots" content="noindex,follow">' : ''}
<link rel="canonical" href="${escape(canonical)}">
<meta property="og:site_name" content="Power Baterias">
<meta property="og:locale" content="pt_BR">
<meta property="og:type" content="${page.path.startsWith('artigo-') ? 'article' : 'website'}">
<meta property="og:title" content="${escape(page.title)}">
<meta property="og:description" content="${escape(page.description)}">
<meta property="og:url" content="${escape(canonical)}">
<meta property="og:image" content="${escape(pageImage)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="./assets/images/brand/bolt.svg" type="image/svg+xml">
<link rel="preload" href="./assets/fonts/manrope-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="./assets/fonts/space-grotesk-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="./assets/css/global.css">
${(page.styles || []).map((style) => `<link rel="stylesheet" href="./assets/css/${style}.css">`).join('')}
${json ? `<script type="application/ld+json">${json}</script>` : ''}
<script type="module" src="./assets/js/main.js"></script>
${(page.scripts || []).map((script) => `<script type="module" src="./assets/js/${script}.js"></script>`).join('')}
</head>
<body${isHome ? ' class="home"' : ''}>
<a class="skip" href="#conteudo">Pular para o conteúdo</a>
${header(page)}
<main id="conteudo" tabindex="-1">${page.body}</main>
${footer()}
${floating ? `<a class="floating-wa" href="${escape(wa(page.message))}" target="_blank" rel="noopener noreferrer" aria-label="Falar com a Power Baterias pelo WhatsApp">${icon('whatsapp')}</a>` : ''}
</body>
</html>`;
}

function alias(path, target, title) {
  return {
    path, title, description: 'Esta página mudou de endereço no site da Power Baterias.',
    noindex: true, canonical: absolute(target),
    body: `<section class="wrap legacy-redirect"><h1>${title}</h1><p>Encontre o conteúdo atualizado no endereço abaixo.</p>${action(rel(target), 'Abrir página atualizada')}</section>`
  };
}

const pages = [...home, ...garage, ...catalog, ...editorial, ...support,
  alias('socorro.html', 'power-sos.html', 'Atendimento Power SOS'),
  alias('loja.html', 'contato.html', 'Contato e localização da loja')
];
for (const path of Object.values(site.heroVideo).filter(Boolean)) {
  if (!/^\.\/assets\/videos\/[a-zA-Z0-9_.-]+\.(webm|mp4)$/.test(path)) throw new Error(`Caminho de vídeo inválido: ${path}`);
  await access(fromRoot(`public/${path}`));
}
const paths = new Set();
for (const page of pages) {
  if (!/^[a-z0-9-]+\.html$/.test(page.path) || paths.has(page.path)) throw new Error(`Rota inválida ou duplicada: ${page.path}`);
  if (!page.title || !page.description || !page.body) throw new Error(`Página incompleta: ${page.path}`);
  paths.add(page.path);
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(fromRoot('public'), output, { recursive: true });
const data = new URL('assets/data/', output);
await mkdir(data, { recursive: true });
for (const file of await readdir(fromRoot('src/data/'))) {
  if (file.endsWith('.json')) await cp(fromRoot(`src/data/${file}`), new URL(file, data));
}

const fonts = new URL('assets/fonts/', output);
await mkdir(fonts, { recursive: true });
for (const font of ['manrope', 'space-grotesk']) {
  const folder = `node_modules/@fontsource-variable/${font}`;
  await cp(fromRoot(`${folder}/files/${font}-latin-wght-normal.woff2`), new URL(`${font}-latin-wght-normal.woff2`, fonts));
  await cp(fromRoot(`${folder}/LICENSE`), new URL(`${font}-OFL.txt`, fonts));
}

const scripts = [...new Set(['main', ...pages.flatMap((page) => page.scripts || [])])];
const styles = [...new Set(['global', ...pages.flatMap((page) => page.styles || [])])];
const prefix = (kind, names, suffix) => Object.fromEntries(names.map((name) => [name, `src/${kind}/${name}.${suffix}`]));
await Promise.all([
  build({ entryPoints: prefix('client', scripts, 'js'), outdir: 'dist/assets/js', bundle: true, format: 'esm', splitting: true, minify: true, target: 'es2022', legalComments: 'linked', logLevel: 'warning' }),
  build({ entryPoints: prefix('styles', styles, 'css'), outdir: 'dist/assets/css', minify: true, logLevel: 'warning' }),
  ...pages.map((page) => writeFile(new URL(page.path, output), render(page)))
]);

const sitemapUrls = pages.filter((page) => !page.noindex).map((page) => `  <url><loc>${escape(absolute(page.path))}</loc></url>`);
await Promise.all([
  writeFile(new URL('sitemap.xml', output), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.join('\n')}\n</urlset>\n`),
  writeFile(new URL('robots.txt', output), `User-agent: *\nAllow: /\nSitemap: ${absolute('sitemap.xml')}\n`),
  writeFile(new URL('.nojekyll', output), '')
]);
console.log(`Build concluído: ${pages.length} páginas estáticas em dist/.`);
