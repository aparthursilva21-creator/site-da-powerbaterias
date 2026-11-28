import products from '../data/products.json' with { type: 'json' };
import applications from '../data/compatibility.json' with { type: 'json' };
import vehicles from '../data/vehicles.json' with { type: 'json' };
import { action, escape, intro, wa } from '../shared.mjs';

const categories = {
  carros: 'Carros',
  motos: 'Motos',
  'suv-picapes': 'SUVs e picapes',
  caminhoes: 'Caminhões',
  'start-stop': 'Start-Stop',
  outros: 'Outras categorias',
};
const technologyDescriptions = {
  Convencional: 'Bateria de partida para aplicações que especificam tecnologia convencional. Verifique a capacidade, a corrente de partida, as dimensões e a disposição dos terminais.',
  EFB: 'Enhanced Flooded Battery é uma evolução da bateria inundada, usada em algumas aplicações com partidas frequentes e sistema Start-Stop. Confira a tecnologia indicada para seu veículo.',
  AGM: 'Absorbent Glass Mat utiliza separadores de fibra de vidro que absorvem o eletrólito. É usada em aplicações específicas, inclusive em alguns veículos com Start-Stop e frenagem regenerativa.',
};

const productName = product => `${product.brand} ${product.model}`;
const productPath = product => `produto-${product.id}.html`;
const productCCA = product => `${product.cca} A${product.ccaTestTemperature != null ? ` a ${String(product.ccaTestTemperature).replace('-', '−')} °C` : ''}`;
const productMessage = product => `Olá! Gostaria de consultar a bateria ${productName(product)} na Power Baterias, confirmar a compatibilidade com meu veículo e solicitar um orçamento.`;
const catalogMessage = 'Olá! Estou consultando o catálogo da Power Baterias e gostaria de ajuda para encontrar uma bateria para meu veículo.';
const approvedImages = product => (product.images || []).filter(image => /^\.\/assets\/[\w./-]+\.(avif|webp|png|jpe?g)$/i.test(image.src) && !image.src.includes('..'));
const httpsSource = url => new URL(url).protocol === 'https:';
const productMedia = (product, expanded = false) => {
  const images = approvedImages(product);
  const descriptor = product.technology || categories[product.categories[0]];
  const image = images[0];
  const mediaStyle = product.brand === 'Heliar' ? 'heliar' : 'moura';
  const fallback = `<div class="catalog-plate" ${image ? 'hidden' : ''}>
  <div class="catalog-plate-meta"><span>${escape(product.brand)}</span><span>${escape(descriptor)}</span></div>
  <span class="catalog-plate-value" aria-hidden="true">${escape(product.capacityAh)} <small>Ah</small></span>
  <span class="catalog-plate-caption">Foto do produto indisponível</span>
</div>`;

  if (!image) return `<div class="catalog-media catalog-media--${mediaStyle}">${fallback}</div>`;

  const renderImage = ({ src, alt }, isMain = false) =>
    `<img src="${escape(src)}" alt="${escape(alt)}" decoding="async" loading="${isMain && expanded ? 'eager' : 'lazy'}">`;
  const features = expanded
    ? `<a class="catalog-zoom" data-product-image href="${escape(image.src)}" aria-label="Ampliar foto da bateria ${escape(productName(product))}">${renderImage(image, true)}</a>
      ${images.length > 1 ? `<ul class="catalog-thumbnails" aria-label="Galeria da bateria">
        ${images.slice(1).map(item => `<li><a data-product-image href="${escape(item.src)}" aria-label="Ampliar ${escape(item.alt)}">${renderImage(item)}</a></li>`).join('')}</ul>` : ''}
      <dialog class="catalog-dialog" aria-label="Foto ampliada" data-product-dialog>
        <form method="dialog"><button class="button" type="submit">Fechar</button></form>
        <img alt="">
      </dialog>`
    : renderImage(image, true);
  return `<div class="catalog-media catalog-media--${mediaStyle}" data-product-media>${features}${fallback}</div>`;
};

function productCard(product) {
  return `<article class="catalog-item" data-catalog-product data-brand="${escape(product.brand)}" data-model="${escape(product.model)}" data-category="${escape(product.categories.join(' '))}" data-capacity="${escape(product.capacityAh)}" data-technology="${escape(product.technology || '')}">
    ${productMedia(product)}
    <div class="catalog-item-body">
      <h3>${escape(productName(product))}</h3>
      <p class="catalog-item-specs">${escape(product.capacityAh)} Ah${product.cca ? ` <span aria-hidden="true">·</span> CCA ${escape(productCCA(product))}` : ''}</p>
      <div class="catalog-item-actions">
        <a class="catalog-details-link" href="./${productPath(product)}" aria-label="Ver detalhes de ${escape(productName(product))}">Ver detalhes</a>
        <a class="catalog-quote-link" href="${escape(wa(productMessage(product)))}" target="_blank" rel="noopener noreferrer" aria-label="Consultar ${escape(productName(product))} pelo WhatsApp">WhatsApp</a>
      </div>
    </div>
  </article>`;
}

function selectFilter(name, label, empty, options) {
  return `<label class="catalog-field" for="catalog-filter-${name}"><span>${label}</span>
    <select id="catalog-filter-${name}" name="${name}">
      <option value="">${empty}</option>
      ${options.map(([value, text]) => `<option value="${escape(value)}">${escape(text)}</option>`).join('')}
    </select>
  </label>`;
}

const brandOptions = [...new Set(products.map(product => product.brand))]
  .sort((a, b) => a.localeCompare(b, 'pt-BR')).map(brand => [brand, brand]);
const capacities = [...new Set(products.map(product => product.capacityAh))]
  .sort((a, b) => a - b).map(value => [String(value), `${value} Ah`]);
const technologies = Object.keys(technologyDescriptions).map(value => [value, value]);
const catalogIntroText = 'Encontre referências Heliar e Moura por código, capacidade e tecnologia. Confirme a aplicação e a disponibilidade com nossa equipe em Samambaia Norte.';

const catalogPage = {
  path: 'baterias.html',
  title: 'Catálogo de baterias Heliar e Moura',
  description: 'Consulte baterias Heliar e Moura, compare capacidades e tecnologias e solicite orientação para seu veículo com a Power Baterias em Brasília.',
  styles: ['catalog'],
  scripts: ['catalog'],
  message: catalogMessage,
  body: `${intro('Catálogo Power Baterias', 'Baterias', catalogIntroText)}
    <section class="wrap section catalog-section" aria-labelledby="catalog-title">
      <div class="catalog-heading">
        <div><h2 id="catalog-title">Encontre um modelo</h2><p class="muted">Comece pelo código da bateria ou use os filtros abaixo.</p></div>
        ${action('./power-garage.html', 'Consultar meu veículo', { variant: 'secondary' })}
      </div>
      <form class="catalog-filters" data-catalog-filters hidden novalidate>
        <label class="catalog-field catalog-field-search" for="catalog-search"><span>Buscar por nome ou código</span>
          <input id="catalog-search" type="search" name="search" maxlength="80" placeholder="Moura M60GD">
        </label>
        ${selectFilter('brand', 'Marca', 'Todas as marcas', brandOptions)}
        ${selectFilter('category', 'Categoria', 'Todas as categorias', Object.entries(categories))}
        ${selectFilter('capacity', 'Capacidade', 'Todas as capacidades', capacities)}
        ${selectFilter('technology', 'Tecnologia', 'Todas as tecnologias', technologies)}
        <div class="catalog-filter-status">
          <p role="status" aria-live="polite" data-catalog-count>${products.length} modelos</p>
          <button type="reset" class="catalog-text-button">Limpar filtros</button>
        </div>
      </form>
      <noscript><p class="catalog-empty">A lista de modelos está disponível abaixo. Ative o JavaScript para usar a pesquisa e os filtros.</p></noscript>
      <div class="catalog-list" data-catalog-list>
        ${products.map(productCard).join('')}
      </div>
      ${products.length ? `<div class="catalog-empty" data-catalog-empty hidden>
        <h3>Nenhum modelo encontrado</h3>
        <p>Tente buscar apenas pelo código ou remova algum filtro.</p>
        <button type="button" class="button button--secondary" data-catalog-reset>Ver todos os modelos</button>
      </div>` : `<div class="catalog-empty"><h3>Catálogo em atualização</h3><p>Fale com a equipe para consultar modelos e disponibilidade.</p></div>`}
      <div class="catalog-assistance">
        <div><h2>Precisa de outra bateria?</h2><p class="muted">Informe o modelo, o ano e a motorização do veículo para consultar outras opções e pedir um orçamento.</p></div>
        ${action(wa(catalogMessage), 'Falar pelo WhatsApp', { external: true })}
      </div>
    </section>`,
};

const productIndex = {
  path: 'produto.html',
  title: 'Selecione uma bateria',
  description: 'Acesse uma ficha de bateria Heliar ou Moura no catálogo da Power Baterias.',
  noindex: true,
  styles: ['catalog'],
  body: `${intro('Fichas técnicas', 'Selecione uma bateria', 'Escolha um modelo para consultar as características e pedir orientação.')}
    <section class="wrap section">
      <ul class="catalog-product-links">${products.map(product => `<li><a href="./${productPath(product)}">${escape(productName(product))}</a></li>`).join('')}</ul>
      ${action('./baterias.html', 'Abrir catálogo', { variant: 'secondary' })}
    </section>`,
};

function productSpecifications(product) {
  const specifications = [
    ['Capacidade nominal', `${product.capacityAh} Ah${product.capacityRate ? ` (${product.capacityRate})` : ''}`],
    ['Tecnologia', product.technology],
    ['Tensão nominal', product.voltage && `${product.voltage} V`],
    ['Corrente de partida a frio (CCA)', product.cca && productCCA(product)],
    ['Capacidade de reserva', product.reserveMinutes && `${product.reserveMinutes} min`],
    ['Dimensões (C × L × A)', product.dimensionsMm && `${product.dimensionsMm.length} × ${product.dimensionsMm.width} × ${product.dimensionsMm.height} mm`],
    ['Polaridade', product.polarity],
    ['Terminais', product.terminalType],
  ];
  return specifications.filter(([, value]) => value);
}

function productApplications(product) {
  const matches = applications.filter(item => item.candidates.includes(product.id));
  const entries = [];

  for (const application of matches) {
    const models = new Map();
    const matchingVehicles = vehicles.filter(vehicle => vehicle.applicationIds.includes(application.id));
    for (const vehicle of matchingVehicles) {
      const label = [vehicle.brand, vehicle.model, vehicle.engine, vehicle.version].filter(Boolean).join(' ');
      const years = models.get(label) || new Set();
      years.add(Number(vehicle.year));
      models.set(label, years);
    }

    for (const [model, yearSet] of models) {
      const years = [...yearSet].sort((a, b) => a - b);
      const isRange = years.length > 2 && years.at(-1) - years[0] + 1 === years.length;
      const yearLabel = isRange ? `${years[0]}–${years.at(-1)}` : years.join(', ');
      const startStop = application.startStop === 'sim' ? ' com Start-Stop' : '';
      const source = application.sources.at(-1);
      entries.push(`<li><strong>${escape(model)} (${escape(yearLabel)})${startStop}</strong><br>
        ${escape(application.exact ? 'Aplicação indicada para esta configuração.' : 'Referência preliminar. Confirme antes da troca.')}
        ${source && httpsSource(source.url) ? `<a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.label)}</a>` : ''}</li>`);
    }
  }

  return entries.length
    ? `<ul class="catalog-applications">${entries.join('')}</ul>`
    : '<p class="muted">Aplicações específicas em validação. Informe o veículo para a equipe confirmar a referência indicada.</p>';
}

function productPage(product) {
  const name = productName(product);
  const specifications = productSpecifications(product);
  const productCategory = categories[product.categories[0]];
  const formatDate = iso => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(iso));
  const related = products.filter(other => other.id !== product.id && other.categories.includes(product.categories[0])).slice(0, 3);
  return {
    path: productPath(product),
    title: `${name} ${product.capacityAh} Ah`,
    description: `Consulte a ficha de ${name}, bateria de ${product.capacityAh} Ah, e confirme a aplicação e disponibilidade com a Power Baterias em Brasília.`,
    styles: ['catalog'],
    scripts: [product, ...related].some(item => approvedImages(item).length) ? ['catalog'] : [],
    message: productMessage(product),
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      model: product.model,
      sku: product.model,
      brand: { '@type': 'Brand', name: product.brand },
      category: productCategory,
      additionalProperty: specifications.map(([name, value]) => ({ '@type': 'PropertyValue', name, value })),
    },
    body: `<div class="wrap catalog-breadcrumb" aria-label="Caminho da página" role="navigation">
      <a href="./baterias.html">Baterias</a><span aria-hidden="true">/</span><span aria-current="page">${escape(name)}</span>
    </div>
    <section class="wrap catalog-product-top" aria-labelledby="product-name">
      ${productMedia(product, true)}
      <div class="catalog-product-title">
        <p class="kicker">${escape(productCategory)}${product.technology ? ` · ${escape(product.technology)}` : ''}</p>
        <h1 id="product-name">${escape(name)}</h1>
        <p class="catalog-product-lead">Bateria de ${escape(product.capacityAh)} Ah${product.cca ? ` com corrente de partida a frio de ${escape(productCCA(product))}` : ''}.</p>
        <p class="muted">Consulte a aplicação para o seu veículo e confirme a disponibilidade com a equipe.</p>
        <div class="catalog-product-actions">
          ${action(wa(productMessage(product)), 'Solicitar orçamento', { external: true })}
          ${action(`./power-garage.html?produto=${encodeURIComponent(product.id)}`, 'Consultar compatibilidade', { variant: 'secondary' })}
        </div>
      </div>
    </section>
    <section class="wrap section catalog-technical" aria-labelledby="product-specifications">
      <div>
        <h2 id="product-specifications">Especificações técnicas</h2>
        <dl class="catalog-spec-table">${specifications.map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>
        ${product.specNote ? `<p class="muted">${escape(product.specNote)}</p>` : ''}
        <p class="catalog-source-date muted">Dados consultados em <time datetime="${escape(product.updatedAt)}">${formatDate(product.updatedAt)}</time>.</p>
        <ul class="catalog-sources">
          ${httpsSource(product.source) ? `<li><a href="${escape(product.source)}" target="_blank" rel="noopener noreferrer">Ver no fabricante</a></li>` : ''}
          ${product.specSource && httpsSource(product.specSource) ? `<li><a href="${escape(product.specSource)}" target="_blank" rel="noopener noreferrer">Consultar registro no Inmetro</a></li>` : ''}
        </ul>
      </div>
      <div class="catalog-guidance">
        <section>
          <h2>Tecnologia e aplicações</h2>
          <p class="muted">${escape(technologyDescriptions[product.technology] || 'Consulte a ficha do fabricante e o manual do veículo para conferir a tecnologia e as orientações aplicáveis.')}</p>
          ${productApplications(product)}
          <a href="./power-garage.html?produto=${encodeURIComponent(product.id)}">Verificar meu veículo no Power Garage</a>
        </section>
        <section>
          <h2>Instalação e garantia</h2>
          <p class="muted">Peça à equipe para conferir fixação, terminais e tecnologia antes da instalação. Alguns veículos exigem o registro da nova bateria no sistema eletrônico.</p>
          ${product.manufacturerWarrantyMonths
            ? `<p class="muted">O fabricante informa ${escape(product.manufacturerWarrantyMonths)} meses de garantia para o modelo. Consulte o certificado da unidade e confirme o procedimento de atendimento com a loja.</p>`
            : '<p class="muted">Consulte o certificado da unidade e confirme o prazo e as condições com a equipe.</p>'}
          <a href="./garantias.html">Informações sobre garantia, trocas e devoluções</a>
        </section>
      </div>
    </section>
    ${related.length ? `<section class="wrap section catalog-related" aria-labelledby="related-products">
      <div class="catalog-heading"><h2 id="related-products">Modelos da mesma categoria</h2><a href="./baterias.html">Ver catálogo</a></div>
      <div class="catalog-list">${related.map(productCard).join('')}</div>
    </section>` : ''}`,
  };
}

export const pages = [catalogPage, productIndex, ...products.map(productPage)];
