import { action, icon, intro, photo, wa } from '../shared.mjs';

const garageMessage = 'Olá! Gostaria de confirmar a compatibilidade de uma bateria pelo Power Garage e solicitar um orçamento.';
const consultButton = action(wa(garageMessage), 'Falar com um especialista', { external: true, icon: 'whatsapp' });
const select = (name, label, { placeholder = 'Selecione uma opção', optional = false, hidden = false } = {}) => `
  <label class="garage-field"${hidden ? ' hidden' : ''}>${label}
    <select name="${name}" ${optional ? '' : 'required'} disabled><option value="">${placeholder}</option></select>
  </label>`;

const garageForm = `
  <div class="garage-panel">
    <h2>Qual é o seu veículo?</h2>
    <p class="muted">Use o ano-modelo e a motorização do seu veículo.</p>
    <p class="garage-progress" id="garage-data-status" role="status"></p>
    <form id="garage-consulta" aria-describedby="garage-data-status" hidden>
      <div class="garage-fields">
        ${select('type', 'Tipo de veículo')}
        ${select('brand', 'Marca')}
        ${select('model', 'Modelo')}
        ${select('year', 'Ano-modelo')}
        ${select('engine', 'Motorização', { hidden: true })}
        ${select('version', 'Versão ou câmbio', { hidden: true })}
        ${select('startStop', 'Sistema Start-Stop', { placeholder: 'Não sei informar', optional: true, hidden: true })}
        ${select('product', 'Bateria para comparar', { placeholder: 'Mostrar referências da base', optional: true })}
      </div>
      <button class="button button--primary" type="submit" disabled>${icon('battery')}Consultar compatibilidade</button>
    </form>
    <noscript><p>Ative o JavaScript para consultar a base. Você também pode confirmar a bateria por WhatsApp.</p></noscript>
    <details class="garage-manual" id="veiculo-fora-da-base">
      <summary>Meu veículo não aparece na consulta</summary>
      <p class="muted">Informe marca, modelo, ano e motorização à equipe. Se possível, mencione a tecnologia e o código da bateria atual.</p>
      ${consultButton}
    </details>
  </div>`;

const garageViewer = `
  <figure class="garage-viewer" data-viewer data-model="./assets/models/sport-sedan-hood.glb">
    <div class="garage-stage">
      ${photo('./assets/images/hero-mobile.webp', '', { className: 'garage-poster', width: 840, height: 626, eager: true }).replace('<img ', '<img data-viewer-poster ')}
      <div class="garage-canvas" data-viewer-canvas hidden></div>
      <p class="garage-stage-label">Visualização ilustrativa</p>
      <button type="button" class="button button--secondary garage-viewer-start" data-viewer-start hidden>Explorar em 3D</button>
    </div>
    <figcaption>
      <p class="garage-viewer-status muted" data-viewer-status role="status"></p>
      <div class="garage-viewer-controls" data-viewer-controls hidden>
        <button type="button" class="button button--secondary" data-viewer-reset>Redefinir câmera</button>
        <button type="button" class="button button--secondary" data-viewer-hood hidden>Abrir capô</button>
        <button type="button" class="button button--secondary" data-viewer-install hidden>Ver instalação ilustrada</button>
      </div>
      <p class="garage-caption muted">Sedã e compartimento ilustrativos. Consulte a ficha técnica do veículo para confirmar a aplicação.</p>
      <p class="garage-credit muted" data-viewer-credit hidden>
        Sport Sedan de <a href="https://vinish.dev/free-3d-models/" target="_blank" rel="noopener noreferrer">vinish.dev</a>,
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. Capô adaptado pelo projeto Power Garage.
      </p>
    </figcaption>
  </figure>`;

export const pages = [{
  path: 'power-garage.html',
  title: 'Power Garage | Consulte a bateria do seu veículo',
  description: 'Consulte referências técnicas de baterias automotivas e confirme a aplicação com a Power Baterias em Brasília.',
  styles: ['garage'],
  scripts: ['garage'],
  message: garageMessage,
  body: `
    ${intro('Consulta de compatibilidade', 'Power Garage', 'Encontre referências de bateria para a configuração do seu veículo e confirme a aplicação com a equipe.')}
    <section class="section garage-section" aria-label="Consulta e visualização automotiva">
      <div class="wrap">
        <div class="garage-grid">${garageForm}${garageViewer}</div>
        <section class="garage-result" id="garage-result" aria-label="Resultado da consulta" tabindex="-1" hidden></section>
        <details class="garage-legend">
          <summary>Como interpretar o resultado</summary>
          <dl>
            <div><dt>Compatibilidade identificada</dt><dd>Existe aplicação específica indicada por fonte técnica.</dd></div>
            <div><dt>Necessita confirmação técnica</dt><dd>Há uma indicação parcial ou requisitos que precisam de conferência.</dd></div>
            <div><dt>Incompatível</dt><dd>Foi identificada uma divergência em um requisito documentado.</dd></div>
            <div><dt>Dados indisponíveis</dt><dd>A base ainda não oferece evidência suficiente para essa consulta.</dd></div>
          </dl>
        </details>
      </div>
    </section>`
}];
