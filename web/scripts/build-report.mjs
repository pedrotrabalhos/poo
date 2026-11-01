import { build } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { chromium } from 'playwright'
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve, basename, extname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { randomUUID } from 'node:crypto'

const web = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = resolve(web, '..')
const source = resolve(root, 'docs/relatorio')
const output = resolve(root, 'docs/entrega')
const temporary = await mkdtemp(resolve(tmpdir(), 'vehicle-report-build-'))
const entry = resolve(source, `relatorio.generated.${randomUUID()}.html`)
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const javaRoot = 'src/main/java/br/edu/vehicleinventory/'
let browser

function between(text, start, end) {
  const from = text.indexOf(start)
  const to = end ? text.indexOf(end, from + start.length) : text.length
  if (from < 0 || to < 0) throw new Error(`Marcador de código ausente: ${start}`)
  const value = text.slice(from, to).trimEnd()
  const leading = Math.min(...value.split('\n').filter(line => line.trim()).map(line => line.match(/^ */)[0].length))
  return value.split('\n').map(line => line.slice(leading)).join('\n').trim()
}
async function java(name) { return readFile(resolve(root, javaRoot, name), 'utf8') }
async function embed(path) {
  const types = { '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' }
  const type = types[extname(path)]
  if (!type) throw new Error(`Formato de anexo não suportado: ${path}`)
  return `data:${type};base64,${(await readFile(path)).toString('base64')}`
}
async function inlineCss(css, folder) {
  const matches = [...css.matchAll(/url\((?:"([^\"]+)"|'([^']+)'|([^\)]+))\)/g)]
  for (const match of matches) {
    const url = (match[1] || match[2] || match[3]).trim()
    if (url.startsWith('data:') || url.startsWith('#')) continue
    if (/^https?:/.test(url)) throw new Error('O relatório precisa funcionar sem recursos externos.')
    const data = await embed(resolve(folder, decodeURIComponent(url.split(/[?#]/)[0])))
    css = css.replace(match[0], `url("${data}")`)
  }
  return css
}

try {
  const identification = JSON.parse(await readFile(resolve(source, 'identificacao.json'), 'utf8'))
  if (!identification.nome) throw new Error('Preencha o nome em docs/relatorio/identificacao.json.')
  const evidence = JSON.parse(await readFile(resolve(output, 'evidencias.json'), 'utf8'))
  if (evidence.screenshots.length !== 6 || evidence.browserErrors.length) throw new Error('Evidências de captura incompletas.')
  const xml = await readFile(resolve(root, 'target/surefire-reports/TEST-br.edu.vehicleinventory.VehicleInventoryApplicationTests.xml'), 'utf8')
  const suite = xml.match(/<testsuite\b[^>]*>/)?.[0]
  const attributes = name => Number(suite?.match(new RegExp(`${name}="(\\d+)"`))?.[1])
  const tests = { tests: attributes('tests'), failures: attributes('failures'), errors: attributes('errors'), skipped: attributes('skipped') }
  if (!tests.tests || tests.failures || tests.errors || tests.skipped) throw new Error('Os testes de backend precisam passar antes de gerar o relatório.')
  const v1 = await readFile(resolve(root, 'src/main/resources/db/migration/V1__create_vehicle_inventory.sql'), 'utf8')
  const v2 = await readFile(resolve(root, 'src/main/resources/db/migration/V2__separate_configurations_from_stock_units.sql'), 'utf8')
  const date = new Date(evidence.capturedAt).toLocaleDateString('pt-BR', { timeZone: 'America/Fortaleza' })
  const values = {
    NOME: identification.nome, DATA: date, DATA_CAPTURA: date, BACKEND_TESTS: tests.tests,
    CODE_BASE: between(await java('shared/BaseEntity.java'), '@MappedSuperclass'),
    CODE_DTO: between(await java('vehicle/VehicleRequest.java'), 'public record VehicleRequest'),
    CODE_RULE: between(await java('vehicle/Vehicle.java'), '    public void ensureRemovable()', '    public VehicleConfiguration getConfiguration()'),
    CODE_CONTROLLER: between(await java('vehicle/VehicleController.java'), '    @PostMapping', '    @PutMapping'),
    CODE_SERVICE: between(await java('vehicle/VehicleService.java'), '    @Transactional\n    public VehicleResponse create', '    @Transactional\n    public VehicleResponse update'),
    CODE_REPOSITORY: between(await java('brand/BrandRepository.java'), 'public interface BrandRepository'),
    CODE_SQL: between(v2, 'CREATE UNIQUE INDEX vehicle_configurations_combination_unique', '-- Preserve units'),
  }
  let html = await readFile(resolve(source, 'relatorio.template.html'), 'utf8')
  for (const [name, value] of Object.entries(values)) html = html.replaceAll(`{{${name}}}`, escape(value))
  if (/\{\{[A-Z_]+\}\}/.test(html)) throw new Error('Ainda existem campos não preenchidos no relatório.')
  await writeFile(entry, html)
  await mkdir(output, { recursive: true })
  const dist = resolve(temporary, 'dist')
  await build({ configFile: false, root: source, base: './', plugins: [tailwindcss()], build: {
    outDir: dist, emptyOutDir: true, cssCodeSplit: false, assetsInlineLimit: 0,
    rollupOptions: { input: entry },
  } })
  html = await readFile(resolve(dist, basename(entry)), 'utf8')
  for (const match of [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)]) {
    const href = match[0].match(/href="([^"]+)"/)?.[1]
    if (!href) throw new Error('CSS compilado não encontrado.')
    const path = resolve(dist, href)
    const css = await inlineCss(await readFile(path, 'utf8'), dirname(path))
    html = html.replace(match[0], `<style data-source="web/src/index.css + docs/relatorio/relatorio.css">${css}</style>`)
  }
  for (const match of [...html.matchAll(/<img\b[^>]*src="([^"]+)"[^>]*>/g)]) {
    const data = await embed(resolve(dist, match[1]))
    html = html.replace(match[0], match[0].replace(match[1], data))
  }
  const htmlPath = resolve(output, 'relatorio-tecnico.html')
  await writeFile(htmlPath, html)
  await writeFile(resolve(output, 'modelo-fisico.sql'), '-- Modelo físico PostgreSQL: reprodução das migrações reais V1 e V2.\n-- Execute somente em um esquema novo e vazio. No sistema, utilize o Flyway.\nBEGIN;\n\n-- V1\n' + v1 + '\n-- V2\n' + v2 + '\nCOMMIT;\n')

  browser = await chromium.launch()
  const context = await browser.newContext({ offline: true, viewport: { width: 1440, height: 1100 }, locale: 'pt-BR' })
  const page = await context.newPage()
  const failures = []
  page.on('pageerror', error => failures.push(error.message))
  page.on('requestfailed', request => failures.push(request.url()))
  await page.goto(pathToFileURL(htmlPath).href)
  await page.evaluate(() => document.fonts.ready)
  const validation = await page.evaluate(name => ({
    pages: document.querySelectorAll('.report-page').length,
    images: [...document.images].map(image => ({ loaded: image.complete && image.naturalWidth > 0, alt: image.alt })),
    family: getComputedStyle(document.body).fontFamily,
    overflowing: document.documentElement.scrollWidth > window.innerWidth,
    hasName: document.body.innerText.includes(name),
    hasQuestions: [...document.querySelectorAll('#levantamento ~ table tbody tr')].length,
  }), identification.nome)
  if (validation.pages !== 7 || validation.images.length !== 6 || validation.images.some(image => !image.loaded || !image.alt) || validation.overflowing || !validation.hasName || validation.hasQuestions < 10 || !validation.family.includes('Plus Jakarta Sans Variable') || failures.length) {
    throw new Error(`Falha na validação do HTML: ${JSON.stringify({ validation, failures })}`)
  }
  await page.locator('.report-page').first().screenshot({ path: resolve(temporary, 'primeira-pagina.png') })
  await page.pdf({ path: resolve(output, 'relatorio-tecnico.pdf'), preferCSSPageSize: true, printBackground: true,
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;font:9px sans-serif;color:#737373;padding:0 14mm;display:flex;justify-content:space-between"><span>Gestão de estoque de veículos · Relatório técnico</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
  })
  await writeFile(resolve(output, 'verificacao-relatorio.json'), JSON.stringify({
    generatedAt: new Date().toISOString(), author: identification.nome, backendTests: tests,
    screenshotCount: evidence.screenshots.length, offlineHtml: true, validation, browserErrors: failures,
    themeSource: 'web/src/index.css',
  }, null, 2) + '\n')
  console.log('Relatório HTML autossuficiente, PDF e SQL gerados em docs/entrega/.')
  console.log(`Validados sem rede: ${validation.images.length} imagens e ${validation.pages} seções; backend: ${tests.tests} testes aprovados.`)
} finally {
  await browser?.close()
  await rm(entry, { force: true })
  await rm(temporary, { recursive: true, force: true })
}
