import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import products from '../src/data/products.json' with { type: 'json' }

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const requiredRoutes = [
  'index.html',
  'power-garage.html',
  'baterias.html',
  'produto.html',
  'power-sos.html',
  'servicos.html',
  'sobre.html',
  'conteudos.html',
  'artigo.html',
  'contato.html',
  'privacidade.html',
  'termos.html',
  'garantias.html',
  'cookies.html',
  '404.html'
]
const read = (name) => readFileSync(join(dist, name), 'utf8')
const routes = readdirSync(dist).filter((path) => path.endsWith('.html'))
const documents = new Map(routes.map((path) => [path, read(path)]))

function tags(html, names) {
  return [...html.matchAll(new RegExp(`<(?:${names})\\b[^>]*>`, 'gi'))].map(([tag]) => tag)
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'))
  return (match?.[1] ?? match?.[2])?.replaceAll('&amp;', '&')
}

function meta(html, key, name) {
  return tags(html, 'meta').find((tag) => attribute(tag, key) === name)
}

function refs(html) {
  const files = []
  for (const tag of tags(html, 'a|link|script|img|source|video|track|iframe|figure')) {
    for (const name of ['href', 'src', 'poster', 'data-src', 'data-model']) {
      const value = attribute(tag, name)
      if (value) files.push(value)
    }
    const srcset = attribute(tag, 'srcset')
    if (srcset) {
      files.push(...srcset.split(',').map((entry) => entry.trim().split(/\s+/)[0]))
    }
  }
  return files
}

function localRef(ref, from, base) {
  const url = new URL(ref, new URL(from, base))
  if (url.origin !== base.origin) return null
  if (!url.pathname.startsWith(base.pathname)) {
    throw new Error(`O caminho sai do diretório publicado: ${ref}`)
  }
  return {
    path: decodeURIComponent(url.pathname.slice(base.pathname.length)) || 'index.html',
    hash: decodeURIComponent(url.hash.slice(1))
  }
}

test('gera cada página solicitada e os nove artigos como HTML estático', () => {
  for (const route of requiredRoutes) assert.ok(documents.has(route), route)
  for (const product of products) {
    const path = `produto-${product.id}.html`
    assert.ok(documents.has(path), path)
    assert.ok(documents.get('baterias.html').includes(path), `${path} deve estar disponível no catálogo`)
  }
  const articles = routes.filter((route) => route.startsWith('artigo-'))
  assert.ok(articles.length >= 9, `Há ${articles.length} artigos estáticos`)
})

test('páginas têm títulos exclusivos, estrutura semântica e imagens com alt', () => {
  const pageTitles = new Set()
  for (const [route, html] of documents) {
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim()
    assert.ok(title, `${route}: título`)
    assert.ok(!pageTitles.has(title), `${route}: título duplicado, ${title}`)
    pageTitles.add(title)

    assert.match(html, /<html\b[^>]*\blang=["']pt(?:-BR)?["']/i, route)
    assert.equal(tags(html, 'h1').length, 1, `${route}: h1`)
    assert.equal(tags(html, 'main').length, 1, `${route}: main`)
    assert.equal(tags(html, 'footer').length, 1, `${route}: footer`)
    assert.ok(attribute(meta(html, 'name', 'description') ?? '', 'content'), `${route}: descrição`)
    for (const img of tags(html, 'img')) {
      assert.notEqual(attribute(img, 'alt'), undefined, `${route}: ${img}`)
    }
  }
})

test('resolução de links, âncoras e arquivos no subdiretório do GitHub Pages', () => {
  const fallbackBase = 'https://preview.invalid/site-da-powerbaterias/'
  const getCanonical = (html) => tags(html, 'link').find((tag) => attribute(tag, 'rel') === 'canonical')
  const base = new URL(attribute(getCanonical(documents.get('index.html')) ?? '', 'href') || fallbackBase)
  if (!base.pathname.endsWith('/')) base.pathname = base.pathname.replace(/[^/]*$/, '')

  for (const [route, html] of documents) {
    for (const ref of refs(html)) {
      const resource = localRef(ref, route, base)
      if (!resource) continue
      let path = resolve(dist, resource.path)
      assert.ok(existsSync(path), `${route}: ${ref}`)
      if (statSync(path).isDirectory()) path = join(path, 'index.html')
      assert.ok(existsSync(path), `${route}: falta índice em ${ref}`)
      if (resource.hash && path.endsWith('.html')) {
        const ids = [...readFileSync(path, 'utf8').matchAll(/\sid=["']([^"']+)["']/g)]
        assert.ok(ids.some(([, id]) => id === resource.hash), `${route}: âncora ${ref}`)
      }
    }
  }

  for (const path of readdirSync(dist, { recursive: true }).filter((file) => file.endsWith('.css'))) {
    const css = read(path)
    for (const match of css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/g)) {
      const ref = match[1] ?? match[2] ?? match[3]
      if (ref.startsWith('#')) continue
      const resource = localRef(ref, path, base)
      if (resource) assert.ok(existsSync(resolve(dist, resource.path)), `${path}: ${ref}`)
    }
  }
})

test('sitemap e robots listam apenas URLs indexáveis que o build entrega', () => {
  const sitemap = read('sitemap.xml')
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => new URL(url))
  assert.ok(urls.length >= 20, `URLs no sitemap: ${urls.length}`)
  assert.equal(new Set(urls.map((url) => url.href)).size, urls.length, 'URLs duplicadas')
  assert.match(read('robots.txt'), /Sitemap:\s+https:\/\/\S+\/sitemap\.xml/)
  for (const url of urls) {
    assert.equal(url.protocol, 'https:')
    const route = url.pathname.split('/').pop() || 'index.html'
    assert.ok(documents.has(route), url.href)
    const html = documents.get(route)
    assert.doesNotMatch(attribute(meta(html, 'name', 'robots') ?? '', 'content') || '', /noindex/i, route)
    assert.ok(attribute(meta(html, 'property', 'og:title') ?? '', 'content'), `${route}: Open Graph`)
    const canonicalTag = tags(html, 'link').find((tag) => attribute(tag, 'rel') === 'canonical')
    assert.equal(attribute(canonicalTag ?? '', 'href'), url.href, `${route}: canonical x sitemap`)
  }
})

test('links públicos de consulta usam o WhatsApp da empresa e não carregam seu SDK', () => {
  for (const route of ['index.html', 'power-garage.html', 'baterias.html', 'power-sos.html', 'contato.html']) {
    const html = documents.get(route)
    const whatsapp = refs(html).filter((ref) => ref.startsWith('https://wa.me/'))
    assert.ok(whatsapp.length > 0, `${route}: acesso ao WhatsApp`)
    for (const ref of whatsapp) {
      assert.equal(new URL(ref).pathname, '/5561995191090', route)
    }
    for (const script of tags(html, 'script')) {
      assert.doesNotMatch(attribute(script, 'src') || '', /^https?:\/\//i, route)
    }
  }
})
