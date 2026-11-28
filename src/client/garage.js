import { wa } from './common.js';
import { evaluateCompatibility, matchingVehicles, selectApplication, vehicleFields } from './compatibility.js';

const garageHeading = 'Olá! Fiz uma consulta pelo Power Garage da Power Baterias.';
const typeNames = ['Carro', 'SUV', 'Picape', 'Moto', 'Caminhão', 'Utilitário'];
const stopLabels = { sim: 'Sim', não: 'Não' };
const statuses = {
  compatible: ['✓', 'Compatibilidade identificada'],
  confirm: ['!', 'Necessita confirmação técnica'],
  incompatible: ['×', 'Incompatível'],
  unknown: ['–', 'Dados indisponíveis']
};
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });

async function loadData(file) {
  const response = await fetch(new URL('../data/' + file + '.json', import.meta.url));
  if (!response.ok) throw new Error('Base de dados indisponível.');
  const value = await response.json();
  if (!Array.isArray(value)) throw new Error('Formato de dados inválido.');
  return value;
}

function node(tag, content, className) {
  const element = document.createElement(tag);
  if (content) element.textContent = content;
  if (className) element.className = className;
  return element;
}

function addOptions(select, options, previousValue = '') {
  const placeholder = select.options[0].cloneNode(true);
  select.replaceChildren(placeholder, ...options.map(([value, label]) => new Option(label, value)));
  if (options.some(([value]) => value === previousValue)) select.value = previousValue;
  select.disabled = options.length === 0;
}

function updateDependentFields(form, vehicles, fieldChanged) {
  const selection = {};
  for (const [index, field] of vehicleFields.entries()) {
    const select = form.elements[field];
    if (field === 'type') {
      selection.type = select.value;
      continue;
    }
    const matches = matchingVehicles(vehicles, selection);
    const hasParent = vehicleFields.slice(0, index).every(name => form.elements[name].disabled || selection[name]);
    const candidates = field === 'startStop'
      ? hasParent && selection.year && matches.some(row => row.startStopRelevant)
        ? Object.entries(stopLabels) : []
      : hasParent ? [...new Set(matches.map(row => row[field]).filter(Boolean))]
          .sort((a, b) => field === 'year' ? Number(b) - Number(a) : a.localeCompare(b, 'pt-BR'))
          .map(value => [value, value]) : [];
    if (index >= vehicleFields.indexOf('engine')) select.parentElement.hidden = candidates.length === 0;
    const keepPrevious = !fieldChanged || index <= vehicleFields.indexOf(fieldChanged);
    addOptions(select, candidates, keepPrevious ? select.value : '');
    selection[field] = select.value;
  }
  return selection;
}

function renderRequirements(application, result) {
  const spec = application?.requirements ?? {};
  const dimensions = spec.maxDimensionsMm;
  const entries = [
    ['Tensão', spec.voltage && spec.voltage + ' V'],
    ['Capacidade', spec.capacityAh && spec.capacityAh + ' Ah'],
    ['Capacidade mínima', spec.minimumCapacityAh && spec.minimumCapacityAh + ' Ah'],
    ['Corrente de partida mínima', spec.minimumCca && [spec.minimumCca + ' A', spec.ccaStandard].filter(Boolean).join(' · ')],
    ['Tecnologia indicada', spec.technology === 'SLI' ? 'Convencional (SLI)' : spec.technology],
    ['Dimensões máximas (C × L × A)', dimensions && [dimensions.length, dimensions.width, dimensions.height].map(value => value || '—').join(' × ') + ' mm'],
    ['Polaridade', spec.polarity],
    ['Posição dos terminais', spec.terminalPosition],
    ['Tipo de terminal', spec.terminalType],
    ['Referência original', spec.oemModel]
  ].filter(([, value]) => value);
  if (entries.length) {
    const list = node('dl', '', 'garage-requirements');
    list.append(...entries.map(([label, value]) => {
      const item = node('div');
      item.append(node('dt', label), node('dd', value));
      return item;
    }));
    result.append(node('h3', 'Requisitos documentados'), list);
  }
  if (application?.restriction) result.append(node('p', application.restriction));
}

function renderSources(application, result) {
  if (!application?.sources?.length) return;
  const list = node('ul');
  for (const source of application.sources) {
    let url;
    try { url = new URL(source.url); } catch { continue; }
    if (url.protocol !== 'https:') continue;
    const item = node('li');
    const link = node('a', source.label);
    link.href = url.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    item.append(link);
    list.append(item);
  }
  const lastCheck = new Date(application.checkedAt);
  const sourceHeading = node('h3', 'Fontes técnicas');
  result.append(sourceHeading, list);
  if (!Number.isNaN(lastCheck.valueOf())) {
    result.append(node('p', 'Consulta às fontes em ' + dateFormatter.format(lastCheck) + '.', 'muted'));
  }
}

function renderResult({ selection, result, application, selectedProduct, products }) {
  const candidates = (application?.candidates ?? []).map(id => products.find(product => product.id === id)).filter(Boolean);
  const availableCandidates = candidates.filter(product => evaluateCompatibility(application, product, selection).status !== 'incompatible');
  const product = selectedProduct ?? availableCandidates[0];
  const evaluation = evaluateCompatibility(application, product, selection);
  const [symbol, status] = statuses[evaluation.status];
  const vehicleName = [selection.brand, selection.model].filter(Boolean).join(' ');
  const vehicleDetails = [selection.year, selection.engine, selection.version].filter(Boolean).join(' · ');
  const title = [vehicleName || selection.type, vehicleDetails].filter(Boolean).join(' · ');
  const badge = node('p', '', 'garage-badge');
  const badgeIcon = node('span', symbol, 'garage-badge-icon');
  badgeIcon.setAttribute('aria-hidden', 'true');
  badge.append(badgeIcon, node('span', status));

  result.dataset.status = evaluation.status;
  result.replaceChildren(node('h2', title || 'Resultado da consulta'), badge, node('p', evaluation.reason));
  if (selection.startStop) result.append(node('p', 'Sistema Start-Stop: ' + stopLabels[selection.startStop] + '.'));
  if (selectedProduct) result.append(node('p', 'Bateria consultada: ' + selectedProduct.brand + ' ' + selectedProduct.model + '.'));

  renderRequirements(application, result);
  if (availableCandidates.length) {
    const list = node('ul');
    for (const candidate of availableCandidates) {
      const item = node('li');
      const link = node('a', candidate.brand + ' ' + candidate.model);
      link.href = './produto-' + encodeURIComponent(candidate.id) + '.html';
      item.append(link);
      list.append(item);
    }
    result.append(node('h3', 'Baterias indicadas na fonte'), list);
  }
  renderSources(application, result);

  const message = [
    garageHeading,
    vehicleName && 'Veículo: ' + vehicleName,
    !vehicleName && selection.type && 'Tipo: ' + selection.type,
    selection.year && 'Ano: ' + selection.year,
    selection.engine && 'Motorização: ' + selection.engine,
    selection.version && 'Versão ou câmbio: ' + selection.version,
    selection.startStop && 'Start-Stop: ' + stopLabels[selection.startStop],
    product && 'Bateria consultada: ' + product.brand + ' ' + product.model,
    'Gostaria de confirmar a compatibilidade e solicitar um orçamento.'
  ].filter(Boolean).join('\n\n');
  const contact = node('a', 'Confirmar com um especialista', 'button button--primary');
  contact.href = wa(message);
  contact.target = '_blank';
  contact.rel = 'noopener noreferrer';
  result.append(contact);
  result.hidden = false;
  result.focus();
}

async function initConsultation() {
  const form = document.querySelector('#garage-consulta');
  const result = document.querySelector('#garage-result');
  const status = document.querySelector('#garage-data-status');
  if (!form || !result || !status) return;
  status.textContent = 'Carregando as opções de consulta…';

  const [vehicleData, compatibilityData, productData] = await Promise.allSettled([
    loadData('vehicles'),
    loadData('compatibility'),
    loadData('products')
  ]);
  if (vehicleData.status !== 'fulfilled' || compatibilityData.status !== 'fulfilled') {
    status.textContent = 'A consulta está indisponível. Use o atendimento abaixo para confirmar a aplicação.';
    return;
  }

  const vehicles = vehicleData.value;
  const applications = compatibilityData.value;
  const products = productData.status === 'fulfilled' ? productData.value : [];
  const productParam = new URLSearchParams(location.search).get('produto') ?? '';
  const submit = form.querySelector('button[type="submit"]');
  const productOptions = products.map(({ id, brand, model }) => [id, brand + ' ' + model]);
  addOptions(form.elements.type, typeNames.map(type => [type, type]));
  addOptions(form.elements.product, productOptions, productParam);

  const update = changed => {
    const selection = updateDependentFields(form, vehicles, changed);
    const noTypeData = selection.type && !vehicles.some(vehicle => vehicle.type === selection.type);
    submit.disabled = !selection.type || (!noTypeData && [...form.elements].some(control => control.required && !control.disabled && !control.value));
    status.textContent = noTypeData ? 'A base ainda não inclui veículos desse tipo.' : '';
    if (productData.status !== 'fulfilled') {
      status.textContent += (status.textContent ? ' ' : '') + 'O catálogo está indisponível. A consulta de requisitos continua disponível.';
    }
    result.hidden = true;
    return selection;
  };
  update();
  form.hidden = false;
  form.addEventListener('change', event => update(vehicleFields.includes(event.target.name) ? event.target.name : undefined));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const selection = updateDependentFields(form, vehicles);
    const [vehicle] = matchingVehicles(vehicles, selection);
    const selectedProduct = products.find(product => product.id === form.elements.product.value);
    const application = selectApplication(applications, vehicle, selection.startStop);
    renderResult({ selection, result, application, selectedProduct, products });
  });
}

function initViewer() {
  const viewer = document.querySelector('[data-viewer]');
  if (!viewer) return;
  const start = viewer.querySelector('[data-viewer-start]');
  const poster = viewer.querySelector('[data-viewer-poster]');
  const status = viewer.querySelector('[data-viewer-status]');
  if (!viewer.dataset.model) return;
  start.hidden = false;

  const hideBrokenPoster = () => { poster.hidden = true; };
  poster.addEventListener('error', hideBrokenPoster, { once: true });
  if (poster.complete && !poster.naturalWidth) hideBrokenPoster();

  start.addEventListener('click', async () => {
    start.disabled = true;
    status.textContent = 'Carregando o estúdio 3D…';
    try {
      const { mountViewer } = await import('./viewer.js');
      await mountViewer(viewer);
    } catch {
      status.textContent = 'O modelo 3D não carregou. A consulta de compatibilidade continua disponível.';
    } finally {
      start.disabled = false;
    }
  });
}

void initConsultation();
initViewer();
