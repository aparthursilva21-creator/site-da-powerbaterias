import { existsSync } from 'node:fs';
import { action, escape, icon, intro, photo, site, wa } from '../shared.mjs';

const reasons = [
  'Meu carro não liga',
  'Minha bateria descarregou',
  'Preciso trocar minha bateria',
  'Quero solicitar uma visita técnica',
  'Preciso falar com um especialista',
];

const sosMessage = 'Olá! Preciso de atendimento pelo Power SOS da Power Baterias.';
const contactMessage = 'Olá! Gostaria de falar com a Power Baterias.';
function optionalPhoto(filename, alt, className, eager = false) {
  if (!existsSync(new URL(`../../public/assets/images/${filename}`, import.meta.url))) return '';
  return photo(`./assets/images/${filename}`, alt, { className, eager });
}

const sosImage = optionalPhoto('sos.webp', '', 'support-hero__image', true);
const storeImage = optionalPhoto('store.webp', 'Fachada da loja Power Baterias em Samambaia Norte', 'contact-photo');

const sos = {
  path: 'power-sos.html',
  title: 'Power SOS | Atendimento automotivo em Brasília',
  description: 'O carro não liga? Fale com a Power Baterias pelo WhatsApp para avaliar o problema e consultar atendimento em Brasília.',
  styles: ['support'],
  scripts: ['support'],
  message: sosMessage,
  body: `
    <section class="support-hero${sosImage ? ' support-hero--image' : ''}">
      ${sosImage}
      <div class="wrap support-hero__content">
        <p class="kicker">Power SOS</p>
        <h1>Seu carro<br>não liga?</h1>
        <p>Conte com a Power Baterias para avaliar o problema e orientar você sobre a solução adequada.</p>
        <div class="support-actions">
          ${action(wa(sosMessage), 'Falar no WhatsApp', { external: true })}
          ${action('#atendimento', 'Ver opções de atendimento', { variant: 'secondary' })}
        </div>
      </div>
    </section>
    <section class="section wrap support-layout" id="atendimento" aria-labelledby="support-options-title">
      <div class="support-quick">
        <p class="kicker">Atendimento direto</p>
        <h2 id="support-options-title">Como podemos ajudar?</h2>
        <ul class="support-reason-list">
          ${reasons.map((reason) => `<li><a href="${escape(wa(`Olá! Falo pelo Power SOS. ${reason}.`))}" target="_blank" rel="noopener noreferrer">${escape(reason)}</a></li>`).join('')}
        </ul>
        <p class="support-risk">Se houver fumaça, vazamento ou risco imediato, mantenha distância do veículo e procure assistência de emergência apropriada.</p>
      </div>
      <form class="support-form panel" data-sos-form action="${escape(site.whatsappUrl)}" method="get" target="_blank" rel="noopener noreferrer" aria-labelledby="sos-form-title" hidden>
        <h2 id="sos-form-title">Conte o que aconteceu</h2>
        <p class="muted">Preencha o que souber. Você poderá conferir a mensagem no WhatsApp antes de enviar.</p>
        <input type="hidden" name="text" data-sos-message>
        <div class="support-form__fields">
          <label for="sos-name">Nome
            <input id="sos-name" maxlength="80" autocomplete="name" placeholder="Como podemos chamar você?">
          </label>
          <label for="sos-issue">Tipo de atendimento
            <select id="sos-issue">
              <option value="">Selecione se souber</option>
              ${reasons.map((reason) => `<option>${escape(reason)}</option>`).join('')}
            </select>
          </label>
          <label for="sos-vehicle">Veículo
            <input id="sos-vehicle" maxlength="100" placeholder="Marca e modelo">
          </label>
          <label for="sos-year">Ano
            <input id="sos-year" type="number" inputmode="numeric" min="1886" step="1" placeholder="Se souber">
          </label>
          <label class="support-field--wide" for="sos-description">Descrição do problema
            <textarea id="sos-description" maxlength="700" rows="3" placeholder="O que acontece ao tentar ligar o veículo?"></textarea>
          </label>
          <label class="support-field--wide" for="sos-address">Endereço ou ponto de referência <span class="muted">(opcional)</span>
            <input id="sos-address" maxlength="220" placeholder="Bairro, rua ou local próximo">
          </label>
        </div>
        <div class="support-location">
          <div class="support-actions">
            <button type="button" class="button support-outline" data-locate aria-describedby="sos-location-hint">Usar minha localização</button>
            <button type="button" class="button support-outline" data-remove-location hidden>Remover localização</button>
          </div>
          <p class="muted" id="sos-location-hint">Se autorizar no navegador, a mensagem incluirá uma localização aproximada.</p>
          <p class="support-status" data-location-status role="status"></p>
        </div>
        <div class="support-form__footer">
          <button type="submit" class="button support-submit">Continuar no WhatsApp</button>
          <p class="muted">O site prepara a mensagem no seu dispositivo. Confira a <a href="./privacidade.html">política de privacidade</a>.</p>
          <p class="support-status" data-submit-status role="status"></p>
        </div>
      </form>
      <noscript><p class="muted">Use os links de atendimento direto para conversar no WhatsApp.</p></noscript>
    </section>`,
};

const contact = {
  path: 'contato.html',
  title: 'Contato e localização | Power Baterias',
  description: 'Endereço da Power Baterias em Samambaia Norte, Brasília, DF. Consulte rotas e entre em contato pelo WhatsApp.',
  styles: ['support'],
  scripts: ['support'],
  message: contactMessage,
  body: `
    ${intro('Contato', 'Encontre a Power Baterias', 'Fale com nossa equipe ou trace sua rota até a loja em Samambaia Norte.')}
    <section class="section wrap contact-layout" aria-label="Endereço e atendimento">
      <div class="contact-details">
        <p class="kicker">Loja em Brasília, DF</p>
        <h2>Power Baterias</h2>
        <address>${escape(site.address)}<br>CEP ${escape(site.postalCode)}</address>
        ${storeImage}
        <dl class="contact-channels">
          <div><dt>WhatsApp</dt><dd><a href="${escape(wa(contactMessage))}" target="_blank" rel="noopener noreferrer">${escape(site.phone)}</a></dd></div>
          <div><dt>Instagram</dt><dd><a href="${escape(site.instagramUrl)}" target="_blank" rel="noopener noreferrer">${escape(site.instagram)}</a></dd></div>
        </dl>
        <div class="support-actions">${action(wa(contactMessage), 'Falar pelo WhatsApp', { external: true })}</div>
      </div>
      <div class="contact-map panel" data-contact-map="${escape(site.mapsEmbedUrl)}">
        <div class="contact-map__surface" id="contact-map-surface" data-map-surface>
          <div class="contact-map__placeholder" data-map-placeholder>
            ${icon('pin')}
            <h2>Samambaia Norte</h2>
            <p>Brasília, DF</p>
            <p class="muted" id="map-privacy-note">O mapa é fornecido pelo Google e só carrega quando você solicitar.</p>
          </div>
        </div>
        <p class="support-status" data-map-status role="status"></p>
        <div class="support-actions contact-map__actions">
          <button type="button" class="button support-outline" data-load-map aria-controls="contact-map-surface" aria-describedby="map-privacy-note" aria-expanded="false" hidden>Carregar mapa interativo</button>
          ${action(site.mapsUrl, 'Abrir no Google Maps', { variant: 'secondary', external: true })}
          ${action(site.directionsUrl, 'Traçar rota', { variant: 'secondary', external: true })}
        </div>
      </div>
    </section>`,
};

const notFound = {
  path: '404.html',
  title: 'Página não encontrada | Power Baterias',
  description: 'Encontre os principais caminhos do site da Power Baterias.',
  styles: ['support'],
  noindex: true,
  body: `
    <section class="section wrap support-not-found">
      <p class="kicker">Erro 404</p>
      <h1>Página não encontrada</h1>
      <p class="muted">Use um dos atalhos para continuar.</p>
      <div class="support-actions">
        ${action('./', 'Voltar ao início')}
        ${action('./baterias.html', 'Ver catálogo', { variant: 'secondary' })}
      </div>
    </section>`,
};

export const pages = [sos, contact, notFound];
