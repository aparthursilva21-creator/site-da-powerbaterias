import { photo, icon } from '../shared.mjs';

export function batterySection() {
  return `<section class="battery-section section" aria-labelledby="battery-title" data-battery>
    <div class="wrap battery-layout">
      <div class="battery-explainer">
        <p class="kicker">Por dentro da bateria</p>
        <h2 id="battery-title">O que acontece<br> antes da partida.</h2>
        <p>Uma bateria automotiva de chumbo-ácido de 12 V tem seis células ligadas em série. Na partida, elas fornecem corrente ao motor de arranque pelos terminais.</p>
        <div class="battery-parts">
          <details><summary>Terminais e tampa</summary><p>Os polos positivo e negativo conectam a bateria ao circuito do veículo. A tampa protege e fecha o conjunto de células.</p></details>
          <details><summary>Placas e separadores</summary><p>Dentro de cada célula, placas positivas e negativas alternam-se com separadores porosos. Os separadores evitam o contato direto entre as placas e permitem a passagem de íons.</p></details>
          <details><summary>Eletrólito e caixa</summary><p>A solução de água e ácido sulfúrico permite o transporte de íons durante a carga e a descarga. A caixa isola e protege as células.</p></details>
        </div>
        <p class="battery-reference">Fontes <a href="https://www.moura.com.br/blog/como-funciona-uma-bateria" target="_blank" rel="noopener noreferrer">Moura</a> e <a href="https://www.interstatebatteries.com/support/glossary" target="_blank" rel="noopener noreferrer">Interstate Batteries</a>.</p>
      </div>
      <div class="battery-visual">
        <figure class="battery-figure">
          <div class="battery-stage">
            ${photo('./assets/images/battery.webp', 'Imagem conceitual de uma bateria automotiva de chumbo-ácido sem marca', { className: 'battery-poster', width: 1536, height: 334 })}
            <div class="battery-canvas" aria-hidden="true"></div>
          </div>
          <figcaption>Modelo didático de bateria convencional de chumbo-ácido.</figcaption>
        </figure>
        <div class="battery-controls">
          <button type="button" class="button button--secondary" data-battery-load hidden>${icon('battery')} Explorar em 3D</button>
          <div class="battery-interaction" hidden>
            <label for="battery-separation">Separação das peças</label>
            <input id="battery-separation" type="range" min="0" max="100" step="1" value="0" aria-valuetext="Montada">
            <button type="button" class="button button--secondary" data-battery-scroll aria-pressed="false" hidden>Acompanhar rolagem</button>
          </div>
          <p class="battery-status" role="status"></p>
        </div>
      </div>
    </div>
  </section>`;
}
