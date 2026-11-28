const fold = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function matchesFilters(product, { search, brand, category, capacity, technology } = {}) {
  const searchable = fold(`${product.brand} ${product.model}`);
  const words = fold(search).split(/[\s\-]+/).filter(Boolean);

  return (!brand || fold(product.brand) === fold(brand))
    && (!category || product.categories.includes(category))
    && (!capacity || Number(product.capacityAh) === Number(capacity))
    && (!technology || fold(product.technology) === fold(technology))
    && words.every(word => searchable.includes(word));
}

function setupCatalog() {
  const form = document.querySelector('[data-catalog-filters]');
  if (!form) return;

  const count = form.querySelector('[data-catalog-count]');
  const emptyMessage = document.querySelector('[data-catalog-empty]');
  const fields = [...form.querySelectorAll('input, select')];
  const search = form.elements.namedItem('search');
  const queryKeys = { search: 'q', brand: 'marca', category: 'categoria', capacity: 'capacidade', technology: 'tecnologia' };
  const items = [...document.querySelectorAll('[data-catalog-product]')].map(element => ({
    element,
    product: {
      brand: element.dataset.brand,
      model: element.dataset.model,
      categories: element.dataset.category.split(' '),
      capacityAh: element.dataset.capacity,
      technology: element.dataset.technology,
    },
  }));

  const update = ({ save = true } = {}) => {
    const filters = Object.fromEntries(new FormData(form));
    let visible = 0;
    for (const { element, product } of items) {
      const matches = matchesFilters(product, filters);
      element.hidden = !matches;
      if (matches) visible += 1;
    }

    count.textContent = `${visible} ${visible === 1 ? 'modelo' : 'modelos'}`;
    if (emptyMessage) emptyMessage.hidden = visible > 0;
    form.querySelector('[type="reset"]').disabled = !Object.values(filters).some(value => value.trim());

    if (save) {
      const url = new URL(window.location.href);
      for (const [field, key] of Object.entries(queryKeys)) {
        const value = filters[field].trim();
        if (value) url.searchParams.set(key, value);
        else url.searchParams.delete(key);
      }
      window.history.replaceState(null, '', url);
    }
  };

  const readAddress = () => {
    const params = new URLSearchParams(window.location.search);
    for (const field of fields) {
      const value = params.get(queryKeys[field.name]) || '';
      if (field.tagName === 'SELECT') {
        const option = [...field.options].find(item => fold(item.value) === fold(value));
        field.value = option?.value || '';
      } else {
        field.value = value.slice(0, field.maxLength);
      }
    }
    update({ save: false });
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    update();
  });
  form.addEventListener('input', () => update());
  form.addEventListener('reset', event => {
    event.preventDefault();
    fields.forEach(field => { field.value = ''; });
    update();
    search.focus();
  });
  document.querySelector('[data-catalog-reset]')?.addEventListener('click', () => form.reset());
  window.addEventListener('popstate', readAddress);

  readAddress();
  form.hidden = false;
}

function setupProductImages() {
  for (const media of document.querySelectorAll('[data-product-media]')) {
    const main = media.querySelector('img');
    const fallback = media.querySelector('.catalog-plate');
    const galleryDialog = media.querySelector('[data-product-dialog]');

    const showFallback = () => {
      (main.closest('a') || main).hidden = true;
      fallback.hidden = false;
    };
    if (main.complete && !main.naturalWidth) showFallback();
    main.addEventListener('error', showFallback, { once: true });

    if (typeof galleryDialog?.showModal !== 'function') continue;
    const enlargedImage = galleryDialog.querySelector('img');
    media.querySelectorAll('[data-product-image]').forEach(link => {
      const image = link.querySelector('img');
      const hideBrokenThumbnail = () => {
        const item = link.closest('li');
        if (item) item.hidden = true;
      };
      if (image.complete && !image.naturalWidth) hideBrokenThumbnail();
      image.addEventListener('error', hideBrokenThumbnail, { once: true });
      link.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !image.naturalWidth) return;
        event.preventDefault();
        enlargedImage.src = link.href;
        enlargedImage.alt = image.alt;
        galleryDialog.showModal();
      });
    });
    galleryDialog.addEventListener('close', () => enlargedImage.removeAttribute('src'));
  }
}

if (typeof document !== 'undefined') {
  setupCatalog();
  setupProductImages();
}
