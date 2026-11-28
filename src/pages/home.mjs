import { action, escape, icon, photo, site, wa } from '../shared.mjs';
import { batterySection } from './battery.mjs';

const intro = 'Energia, confiança e atendimento especializado para manter você sempre em movimento.';
const hasVideo = Boolean(site.heroVideo.webm || site.heroVideo.mp4);
const budget = wa('Olá, Power Baterias! Gostaria de consultar opções de bateria e solicitar um orçamento.');

function heroVideo() {
  if (!hasVideo) return '';
  const { webm, mp4, mobileWebm, mobileMp4 } = site.heroVideo;
  return `<video class="hero-video" muted loop playsinline preload="none" poster="./assets/images/hero.webp" aria-hidden="true"
    data-webm="${escape(webm ?? '')}" data-mp4="${escape(mp4 ?? '')}"
    data-mobile-webm="${escape(mobileWebm ?? '')}" data-mobile-mp4="${escape(mobileMp4 ?? '')}"></video>`;
}

export const pages = [{
  path: 'index.html',
  title: 'Power Baterias | Baterias automotivas em Brasília',
  description: 'Baterias Heliar e Moura em Samambaia Norte, Brasília. Consulte a aplicação no Power Garage e fale com a equipe para instalação, testes e atendimento emergencial.',
  styles: ['home', 'battery'],
  scripts: ['home', 'battery'],
  body: `
<section class="hero" aria-labelledby="home-title">
  <div class="hero-media" aria-hidden="true">
    <picture>
      <source media="(max-width: 680px)" srcset="./assets/images/hero-mobile.webp">
      <img src="./assets/images/hero.webp" width="1672" height="941" alt="" fetchpriority="high" decoding="async">
    </picture>
    ${heroVideo()}
  </div>
  <div class="hero-veil"></div>
  <div class="wrap hero-main">
    <div class="hero-content">
      <p class="kicker">Power Baterias — Brasília, DF</p>
      <h1 id="home-title">Seu carro<br>não pode <em>parar.</em></h1>
      <p class="lede">${intro}</p>
      <div class="actions hero-actions">
        ${action('./power-garage.html', 'Encontrar minha bateria', { icon: 'battery' })}
        ${action('./power-sos.html', 'Meu carro não liga', { variant: 'outline', icon: 'bolt' })}
      </div>
    </div>
    <div class="hero-note">
      <span class="hero-load" role="status" hidden>Carregando imagem</span>
      <span>Cena publicitária ilustrativa</span>
      ${hasVideo ? '<button class="button button--outline hero-pause" type="button" hidden>Pausar vídeo</button>' : ''}
    </div>
  </div>
</section>

<div class="home-facts">
  <div class="wrap facts-row">
    <a href="./contato.html">${icon('pin')}<span><strong>Samambaia Norte</strong><small>Brasília, Distrito Federal</small></span></a>
    <a href="./baterias.html">${icon('battery')}<span><strong>Heliar e Moura</strong><small>Encontre a linha para seu veículo</small></span></a>
    <a href="./servicos.html">${icon('wrench')}<span><strong>Instalação e testes</strong><small>Atendimento especializado</small></span></a>
  </div>
</div>

<section class="section home-editorial">
  <div class="wrap home-editorial-grid">
    <div class="home-copy" data-reveal>
      <p class="kicker">A Power Baterias</p>
      <h2>Mais que energia.<br><em>Movimento.</em></h2>
      <p class="lede">Seu veículo precisa de confiança em cada partida. A Power Baterias oferece soluções automotivas com atendimento especializado, produtos de qualidade e orientação para encontrar a bateria adequada.</p>
      <a class="text-link" href="./sobre.html">Conhecer a Power Baterias</a>
    </div>
    <figure class="home-install">
      ${photo('./assets/images/service.webp', 'Mãos enluvadas inspecionam uma bateria em um compartimento automotivo', { width: 1120, height: 840 })}
      <figcaption>Imagem ilustrativa</figcaption>
    </figure>
  </div>
</section>

${batterySection()}

<section class="section home-brands">
  <div class="wrap">
    <div class="home-brands-heading">
      <div class="home-copy" data-reveal><p class="kicker">Marcas e baterias</p><h2>Conheça as linhas.</h2></div>
      ${action('./baterias.html', 'Conhecer baterias', { variant: 'outline' })}
    </div>
    <div class="brand-lines">
      <div class="brand-line">
        <div class="brand-line-copy"><h3>Heliar</h3><p>Confira no catálogo as tecnologias e especificações publicadas pelo fabricante.</p><a class="text-link" href="./baterias.html?marca=Heliar">Explorar Heliar</a></div>
        ${photo('./assets/images/heliar-origem.webp', 'Bateria da linha Heliar SLI Tech', { width: 240, height: 211, className: 'heliar-image' })}
      </div>
      <div class="brand-line brand-line--moura">
        <div class="brand-line-copy"><h3>Moura</h3><p>Explore as linhas convencionais, EFB e AGM e consulte a aplicação adequada.</p><a class="text-link" href="./baterias.html?marca=Moura">Explorar Moura</a></div>
      </div>
    </div>
    <div class="actions brand-actions">${action('./power-garage.html', 'Consultar compatibilidade', { variant: 'outline' })}${action(budget, 'Solicitar orçamento', { external: true, icon: 'whatsapp' })}</div>
  </div>
</section>

<section class="home-garage">
  ${photo('./assets/images/garage.webp', '', { width: 1536, height: 338, className: 'home-garage-image' })}
  <div class="wrap home-garage-inner">
    <div class="home-copy" data-reveal><p class="kicker">Power Garage</p><h2>A bateria certa para o seu veículo.</h2><p class="lede">Consulte as aplicações documentadas e envie os dados do veículo para confirmar a escolha com a equipe.</p>${action('./power-garage.html', 'Entrar no Power Garage', { icon: 'battery' })}</div>
    <span class="home-garage-caption">Visualização ilustrativa</span>
  </div>
</section>

<section class="section home-services">
  <div class="wrap">
    <div class="home-copy" data-reveal><p class="kicker">Serviços</p><h2>Da escolha à instalação.</h2></div>
    <ul class="home-service-list">
      ${[site.services[1], site.services[2], site.services[4], site.services[3]].map((service, index) => `<li>${icon(['wrench', 'shield', 'battery', 'bolt'][index])}<div><h3>${escape(service.title)}</h3><p>${escape(service.description)}</p></div></li>`).join('')}
    </ul>
    ${action('./servicos.html', 'Ver todos os serviços', { variant: 'outline' })}
  </div>
</section>

<section class="home-location">
  <div class="wrap grid-2">
    <div class="home-copy"><p class="kicker">A loja</p><h2>Power Baterias em Samambaia Norte.</h2><address>${escape(site.address)}<br>CEP ${escape(site.postalCode)}</address></div>
    <div class="home-location-actions">
      ${site.verifiedRating ? `<p>${escape(site.verifiedRating.stars)} estrelas · ${escape(site.verifiedRating.count)} avaliações no Google</p>` : ''}
      ${action(site.googleBusinessUrl || site.mapsUrl, 'Ver no Google Maps', { variant: 'outline', external: true, icon: 'pin' })}
      ${action('./contato.html', 'Contato e localização')}
    </div>
  </div>
</section>`
}];
