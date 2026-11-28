import assert from 'node:assert/strict'
import { test } from 'node:test'
import { matchesFilters } from '../src/client/catalog.js'
import products from '../src/data/products.json' with { type: 'json' }

const product = {
  brand: 'Heliar',
  model: 'HEFB60HD',
  technology: 'EFB',
  capacityAh: 60,
  categories: ['carros', 'start-stop']
}

test('catálogo combina marca, categoria, amperagem, tecnologia e busca', () => {
  const filters = {
    search: 'hefB60hd HÉLIAR',
    brand: 'Heliar',
    category: 'start-stop',
    capacity: '60',
    technology: 'EFB'
  }
  assert.ok(matchesFilters(product, filters))
  for (const change of [
    { search: 'm60gd' },
    { brand: 'Moura' },
    { category: 'motos' },
    { capacity: '70' },
    { technology: 'AGM' }
  ]) {
    assert.equal(matchesFilters(product, { ...filters, ...change }), false)
  }
})

test('catálogo identifica publicações com código exclusivo e fonte de fabricante', () => {
  const ids = new Set(products.map((item) => item.id))
  assert.equal(ids.size, products.length)
  for (const item of products) {
    assert.match(item.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    assert.match(item.updatedAt, /^\d{4}-\d{2}-\d{2}$/)
    assert.equal(new URL(item.source).protocol, 'https:')
    assert.ok(item.categories.length > 0, item.id)
    assert.ok(item.capacityAh > 0, item.id)
    assert.equal(item.price, undefined, item.id)
    assert.equal(item.availability, undefined, item.id)
  }
})
