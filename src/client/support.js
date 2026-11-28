function clean(value, maxLength) {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return String(value).replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, maxLength);
}

function approximateLocation(location) {
  const { latitude, longitude } = location ?? {};
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180) return '';
  return `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
}

export function formatSosMessage({ name, issue, vehicle, year, description, address, location } = {}) {
  const coordinates = approximateLocation(location);
  const yearValue = clean(year, 5);
  const fields = [
    ['Nome', clean(name, 80)],
    ['Atendimento', clean(issue, 100)],
    ['Veículo', clean(vehicle, 100)],
    ['Ano', /^\d{4}$/.test(yearValue) ? yearValue : ''],
    ['Problema', clean(description, 700)],
    ['Endereço ou referência', clean(address, 220)],
    ['Localização aproximada', coordinates && `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query: coordinates })}`],
  ];
  return [
    'Olá! Preciso de atendimento pelo Power SOS da Power Baterias.',
    ...fields.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`),
  ].join('\n');
}

function initSos(form) {
  const locate = form.querySelector('[data-locate]');
  const remove = form.querySelector('[data-remove-location]');
  const locationStatus = form.querySelector('[data-location-status]');
  const submitStatus = form.querySelector('[data-submit-status]');
  const hiddenMessage = form.querySelector('[data-sos-message]');
  const year = form.querySelector('#sos-year');
  const input = (field) => form.querySelector(`#sos-${field}`).value;
  let location;
  let request = 0;

  function clearLocation(message) {
    request += 1;
    location = undefined;
    locate.removeAttribute('aria-disabled');
    remove.hidden = true;
    locationStatus.textContent = message;
  }

  locate.addEventListener('click', () => {
    if (locate.hasAttribute('aria-disabled')) return;
    if (!navigator.geolocation) {
      locationStatus.textContent = 'A localização está indisponível neste navegador. Você pode continuar com ou sem um endereço.';
      return;
    }
    const currentRequest = ++request;
    location = undefined;
    locate.setAttribute('aria-disabled', 'true');
    remove.hidden = false;
    remove.textContent = 'Cancelar busca';
    locationStatus.textContent = 'Buscando sua localização. Você pode continuar sem ela.';
    const failed = (error) => {
      if (currentRequest !== request) return;
      const reason = error?.code === 1 ? 'Permissão de localização negada.' : 'Não foi possível obter a localização.';
      clearLocation(`${reason} Você pode continuar com ou sem um endereço.`);
    };
    try {
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        if (currentRequest !== request) return;
        const coordinates = approximateLocation(coords);
        if (!coordinates) {
          failed();
          return;
        }
        location = { latitude: coords.latitude, longitude: coords.longitude };
        locate.removeAttribute('aria-disabled');
        remove.textContent = 'Remover localização';
        locationStatus.textContent = `Localização aproximada incluída (${coordinates}).`;
      }, failed, { enableHighAccuracy: false, maximumAge: 60000, timeout: 8000 });
    } catch (error) {
      failed(error);
    }
  });

  remove.addEventListener('click', () => {
    const message = location ? 'Localização removida.' : 'Busca de localização cancelada.';
    clearLocation(message);
    locate.focus();
  });

  form.addEventListener('submit', () => {
    if (locate.hasAttribute('aria-disabled')) {
      clearLocation('A mensagem foi preparada sem coordenadas.');
    }
    hiddenMessage.value = formatSosMessage({
      name: input('name'),
      issue: input('issue'),
      vehicle: input('vehicle'),
      year: input('year'),
      description: input('description'),
      address: input('address'),
      location,
    });
    submitStatus.textContent = 'Conversa preparada. Confira a mensagem no WhatsApp antes de enviar.';
  });

  year.max = String(new Date().getFullYear() + 1);
  form.hidden = false;
}

function initMap(map) {
  const button = map.querySelector('[data-load-map]');
  const surface = map.querySelector('[data-map-surface]');
  const placeholder = map.querySelector('[data-map-placeholder]');
  const status = map.querySelector('[data-map-status]');
  let frame;
  let timeout;

  function close(message) {
    window.clearTimeout(timeout);
    frame?.remove();
    frame = undefined;
    placeholder.hidden = false;
    button.textContent = 'Carregar mapa interativo';
    button.setAttribute('aria-expanded', 'false');
    status.textContent = message;
  }

  button.addEventListener('click', () => {
    if (frame) {
      close('Mapa interativo fechado.');
      return;
    }
    const embed = document.createElement('iframe');
    frame = embed;
    embed.title = 'Mapa da Power Baterias em Samambaia Norte';
    embed.referrerPolicy = 'no-referrer';
    embed.allowFullscreen = true;
    embed.src = map.dataset.contactMap;
    embed.addEventListener('load', () => {
      if (frame !== embed) return;
      window.clearTimeout(timeout);
      status.textContent = '';
    }, { once: true });
    const failed = () => {
      if (frame === embed) close('O mapa interativo está indisponível. Use o link Abrir no Google Maps.');
    };
    embed.addEventListener('error', failed, { once: true });
    placeholder.hidden = true;
    status.textContent = 'Carregando mapa interativo…';
    button.textContent = 'Ocultar mapa interativo';
    button.setAttribute('aria-expanded', 'true');
    timeout = window.setTimeout(failed, 12000);
    surface.append(embed);
  });

  button.hidden = false;
}

if (typeof document !== 'undefined') {
  const form = document.querySelector('[data-sos-form]');
  const map = document.querySelector('[data-contact-map]');
  if (form) initSos(form);
  if (map) initMap(map);
}
