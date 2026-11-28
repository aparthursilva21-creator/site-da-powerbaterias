import assert from 'node:assert/strict'
import { test } from 'node:test'
import { evaluateCompatibility, matchingVehicles, selectApplication } from '../src/client/compatibility.js'
import vehicles from '../src/data/vehicles.json' with { type: 'json' }
import applications from '../src/data/compatibility.json' with { type: 'json' }
import products from '../src/data/products.json' with { type: 'json' }

const application = {
  id: 'fixture',
  sources: [{ url: 'https://example.invalid/fixture' }],
  checkedAt: '2026-01-01',
  exact: true,
  candidates: ['example-efb'],
  startStop: 'sim',
  requirements: {
    voltage: 12,
    technology: 'EFB',
    minimumCapacityAh: 58,
    minimumCca: 440,
    ccaStandard: 'EN',
    maxDimensionsMm: { length: 242, width: 175, height: 190 }
  }
}
const battery = {
  id: 'example-efb',
  voltage: 12,
  technology: 'EFB',
  capacityAh: 60,
  cca: 460,
  ccaStandard: 'EN',
  dimensionsMm: { length: 242, width: 175, height: 190 }
}
const startStop = { startStop: 'sim' }

test('um registro exato e verificável pode apontar compatibilidade', () => {
  assert.equal(evaluateCompatibility(application, battery, startStop).status, 'compatible')
})

test('tensão, tecnologia, capacidade, corrente e dimensões podem desqualificar a aplicação', () => {
  for (const change of [
    { voltage: 24 },
    { technology: 'Convencional' },
    { capacityAh: 45 },
    { cca: 300 },
    { dimensionsMm: { length: 280, width: 175, height: 190 } }
  ]) {
    assert.equal(evaluateCompatibility(application, { ...battery, ...change }, startStop).status, 'incompatible')
  }
})

test('dados parciais ou documentos ausentes não viram compatibilidade inferida', () => {
  assert.equal(evaluateCompatibility({ ...application, exact: false }, battery, startStop).status, 'confirm')
  assert.equal(evaluateCompatibility(application, { ...battery, id: 'another' }, startStop).status, 'confirm')
  assert.equal(evaluateCompatibility({ ...application, sources: [] }, battery, startStop).status, 'unknown')
  assert.equal(evaluateCompatibility(application, battery, { startStop: 'não' }).status, 'unknown')
  assert.equal(evaluateCompatibility(null, battery, startStop).status, 'unknown')
})

test('marca, modelo e ano são selecionados no mesmo conjunto de veículos', () => {
  const onix = matchingVehicles(vehicles, { type: 'Carro', brand: 'Chevrolet', model: 'Onix', year: 2024 })
  assert.ok(onix.length)
  assert.ok(onix.every((vehicle) => vehicle.year === '2024' && vehicle.model === 'Onix'))
  assert.deepEqual(matchingVehicles(vehicles, { type: 'Moto', brand: 'Chevrolet' }), [])
})

test('base publicada liga veículos e baterias a fontes técnicas datadas', () => {
  const byId = new Map(applications.map((item) => [item.id, item]))
  const productIds = new Set(products.map((item) => item.id))
  assert.equal(byId.size, applications.length, 'IDs de aplicação únicos')
  for (const vehicle of vehicles) {
    for (const id of vehicle.applicationIds) {
      assert.ok(byId.has(id), `Aplicação desconhecida: ${id}`)
    }
  }
  for (const entry of applications) {
    assert.match(entry.checkedAt, /^\d{4}-\d{2}-\d{2}$/)
    assert.ok(entry.sources.length > 0, entry.id)
    for (const source of entry.sources) assert.equal(new URL(source.url).protocol, 'https:')
    for (const id of entry.candidates) assert.ok(productIds.has(id), `Produto desconhecido: ${id}`)
  }

  const [tracker] = matchingVehicles(vehicles, {
    brand: 'Chevrolet', model: 'Tracker', year: '2023', engine: '1.0 Turbo', version: 'LT automático'
  })
  assert.equal(selectApplication(applications, tracker, 'sim')?.id, 'tracker-lt23-com-start-stop')
  assert.equal(selectApplication(applications, tracker, 'não')?.id, 'tracker23-sem-start-stop')
})
