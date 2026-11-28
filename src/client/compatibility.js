export const vehicleFields = ['type', 'brand', 'model', 'year', 'engine', 'version', 'startStop'];

export function matchingVehicles(vehicles, selection) {
  return vehicles.filter(vehicle => vehicleFields.every(field => {
    const value = selection[field];
    if (!value || (field === 'startStop' && !vehicle.startStop)) return true;
    return String(vehicle[field] ?? '') === String(value);
  }));
}

export function selectApplication(compatibility, vehicle, startStop) {
  const options = (vehicle?.applicationIds ?? [])
    .map(id => compatibility.find(application => application.id === id))
    .filter(Boolean);
  return options.find(application => application.startStop && application.startStop === startStop)
    ?? options.find(application => !application.startStop);
}

const normalized = value => String(value ?? '').trim().toLowerCase();

function technology(value) {
  const key = normalized(value);
  return key === 'sli' || key === 'convencional' ? 'sli' : key;
}

function equipmentMismatch(requirements, product) {
  if (!product) return '';
  if (requirements.voltage && product.voltage && Number(requirements.voltage) !== Number(product.voltage)) {
    return 'A tensão do produto difere da tensão exigida pelo veículo.';
  }
  const requiredTechnology = technology(requirements.technology);
  const productTechnology = technology(product.technology);
  if ((requiredTechnology === 'efb' || requiredTechnology === 'agm') && productTechnology === 'sli') {
    return 'O veículo exige uma bateria ' + requiredTechnology.toUpperCase() + '. A bateria consultada é convencional.';
  }
  if (requiredTechnology === 'agm' && productTechnology === 'efb') {
    return 'O veículo exige uma bateria AGM. A bateria consultada é EFB.';
  }
  const dimensionNames = ['length', 'width', 'height'];
  if (dimensionNames.some(key => requirements.maxDimensionsMm?.[key] && product.dimensionsMm?.[key] > requirements.maxDimensionsMm[key])) {
    return 'O produto ultrapassa os limites de dimensão indicados para o compartimento.';
  }
  if (requirements.minimumCapacityAh && product.capacityAh && product.capacityAh < requirements.minimumCapacityAh) {
    return 'A capacidade do produto é inferior ao mínimo exigido pelo veículo.';
  }
  if (requirements.minimumCca && requirements.ccaStandard && product.cca && product.ccaStandard === requirements.ccaStandard && product.cca < requirements.minimumCca) {
    return 'A corrente de partida a frio do produto é inferior ao mínimo exigido pelo veículo.';
  }
  return '';
}

export function evaluateCompatibility(application, product, { startStop } = {}) {
  const applicationMatches = application && (!application.startStop || application.startStop === startStop);
  if (!applicationMatches || !application.sources?.length || !application.checkedAt) {
    return {
      status: 'unknown',
      reason: 'A base disponível não permite identificar uma aplicação para essa configuração.'
    };
  }

  const requirements = application.requirements ?? {};
  const mismatch = equipmentMismatch(requirements, product);
  if (mismatch) return { status: 'incompatible', reason: mismatch };

  const candidate = product && application.candidates?.includes(product.id);
  if (application.exact && candidate) {
    return {
      status: 'compatible',
      reason: 'A fonte técnica indica este produto para a configuração selecionada.'
    };
  }

  if (product && !candidate) {
    const sharedTechnicalData = (requirements.voltage && product.voltage)
      || (requirements.technology && product.technology)
      || (requirements.capacityAh && product.capacityAh);
    return sharedTechnicalData
      ? { status: 'confirm', reason: 'Há dados técnicos para comparar, mas falta uma indicação específica para este produto na configuração selecionada.' }
      : { status: 'unknown', reason: 'A base disponível não vincula este produto à configuração do veículo.' };
  }

  if (candidate || Object.keys(requirements).length) {
    return {
      status: 'confirm',
      reason: application.note || 'O fabricante informa requisitos para o veículo. Confirme o produto, a fixação e os terminais com a equipe.'
    };
  }
  return { status: 'unknown', reason: 'Não há dados técnicos suficientes para concluir a consulta.' };
}
