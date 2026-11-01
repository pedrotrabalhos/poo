import { chromium } from 'playwright'
import { spawn, execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createServer } from 'node:net'
import { randomUUID } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const web = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = resolve(web, '..')
const output = resolve(root, 'docs/entrega/imagens')
const schema = `report_${randomUUID().replaceAll('-', '')}`
const api = 'http://127.0.0.1:18081'
const frontend = 'http://127.0.0.1:5175'
const children = []
const operations = []
const screenshots = []
let browser
let backendLog = ''
const jar = resolve(root, 'target/vehicle-inventory-0.0.1-SNAPSHOT.jar')
const java = process.env.VEHICLE_JAVA_HOME ? resolve(process.env.VEHICLE_JAVA_HOME, 'bin/java') : resolve(process.env.HOME, '.local/share/jdks/temurin-25/bin/java')

async function freePort(port) {
  await new Promise((resolvePort, reject) => {
    const server = createServer()
    server.once('error', () => reject(new Error(`A porta ${port} está ocupada; nenhuma instância existente foi alterada.`)))
    server.listen(port, '127.0.0.1', () => server.close(resolvePort))
  })
}
function launch(command, args, options) {
  const child = spawn(command, args, { detached: true, stdio: ['ignore', 'pipe', 'pipe'], ...options })
  children.push(child)
  child.stdout.on('data', chunk => { backendLog += chunk.toString() })
  child.stderr.on('data', chunk => { backendLog += chunk.toString() })
  return child
}
async function ready(url) {
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    if (children.some(child => child.exitCode !== null)) throw new Error('Um servidor de captura encerrou antes de ficar pronto.')
    try { if ((await fetch(url, { signal: AbortSignal.timeout(2000) })).ok) return } catch {}
    await new Promise(done => setTimeout(done, 300))
  }
  throw new Error(`Tempo esgotado ao iniciar ${url}`)
}
async function request(path, body) {
  const response = await fetch(`${api}/api/${path}`, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {})
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`)
  operations.push({ method: body ? 'POST' : 'GET', path: `/api/${path}`, status: response.status })
  return response.json()
}

try {
  if (!existsSync(jar)) throw new Error('Execute ./scripts/mvn verify antes de capturar as telas.')
  await freePort(18081)
  await freePort(5175)
  await mkdir(output, { recursive: true })
  launch(java, ['-jar', jar], { cwd: root, env: {
    ...process.env, PORT: '18081',
    DB_URL: `jdbc:postgresql://localhost:5432/vehicle_inventory_test?currentSchema=${schema}`,
    SPRING_FLYWAY_SCHEMAS: schema, SPRING_FLYWAY_DEFAULT_SCHEMA: schema,
    SPRING_JPA_PROPERTIES_HIBERNATE_DEFAULT_SCHEMA: schema,
    CORS_ALLOWED_ORIGINS: frontend,
  } })
  await ready(`${api}/actuator/health`)
  if ((await request('brands?size=1')).totalElements !== 0 || (await request('vehicles?size=1')).totalElements !== 0) {
    throw new Error('A captura exige um esquema vazio e isolado.')
  }
  launch('bun', ['run', 'dev', '--host', '127.0.0.1', '--port', '5175'], { cwd: web, env: { ...process.env, VITE_API_BASE_URL: api } })
  await ready(frontend)
  const brand = await request('brands', { name: 'Tesla' })
  const model = await request('models', { brandId: brand.id, name: 'Model 3' })
  const black = await request('vehicle-configurations', { modelId: model.id, color: 'PRETO', specification: '200V', vehicleType: 'CARRO' })
  const white = await request('vehicle-configurations', { modelId: model.id, color: 'BRANCO', specification: '200V', vehicleType: 'CARRO' })
  await request('vehicles', { configurationId: black.id, stockCode: 'TESLA-001', manufactureYear: 2025, price: 150000, mileage: 0, status: 'AVAILABLE' })
  await request('vehicles', { configurationId: black.id, stockCode: 'TESLA-002', manufactureYear: 2024, price: 130000, mileage: 15000, status: 'AVAILABLE' })

  browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1360, height: 1000 }, deviceScaleFactor: 2, locale: 'pt-BR', reducedMotion: 'reduce' })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  async function navigate(label) {
    await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: label, exact: true }).click()
    await page.getByRole('heading', { name: label, level: 1, exact: true }).waitFor()
    await page.getByText('Conectado', { exact: true }).waitFor()
    await page.locator('main').evaluate(element => { element.scrollTop = 0 })
  }
  async function capture(filename, title, description, height = 780, locator) {
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: resolve(output, filename), clip: { x: 0, y: 0, width: 1360, height }, animations: 'disabled' })
    if (locator) await locator.screenshot({ path: resolve(output, filename.replace('.png', '-detalhe.png')), animations: 'disabled' })
    screenshots.push({ file: filename, title, description })
    console.log(`Captura: ${filename}`)
  }
  await page.goto(`${frontend}/#vehicle-configurations`)
  await page.getByRole('row').filter({ hasText: 'BRANCO' }).waitFor()
  await capture('01-configuracoes.png', 'Configurações compartilhadas', 'Tesla Model 3 com as combinações PRETO / 200V e BRANCO / 200V.', 530)
  await navigate('Estoque')
  await page.getByRole('button', { name: 'Nova unidade', exact: true }).first().click()
  await page.getByLabel('Configuração', { exact: true }).selectOption({ label: 'Tesla Model 3 · BRANCO · 200V · Carro' })
  await page.getByLabel('Código de estoque', { exact: true }).fill('TESLA-003')
  await page.getByLabel('Ano de fabricação', { exact: true }).fill('2025')
  await page.getByLabel('Preço (R$)', { exact: true }).fill('155000')
  await capture('02-cadastro.png', 'Cadastro de uma unidade', 'Formulário preenchido para cadastrar TESLA-003, vinculada à configuração branca.', 900, page.getByRole('dialog'))
  const created = page.waitForResponse(response => response.url() === `${api}/api/vehicles` && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click()
  const createResponse = await created
  if (createResponse.status() !== 201) throw new Error('O cadastro pela interface não retornou HTTP 201.')
  operations.push({ method: 'POST', path: '/api/vehicles', status: 201, source: 'interface' })
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  await page.getByRole('row').filter({ hasText: 'TESLA-003' }).waitFor()
  await capture('03-estoque.png', 'Consulta do estoque', 'Três unidades registradas; duas compartilham a configuração preta e mantêm dados próprios.', 790)

  await page.getByRole('button', { name: 'Situação', exact: true }).click()
  await page.getByRole('menuitemradio', { name: 'Disponível', exact: true }).click()
  await page.getByRole('button', { name: 'Filtros', exact: true }).click()
  await page.getByLabel('Preço mínimo', { exact: true }).fill('140000')
  await page.getByLabel('Preço máximo', { exact: true }).fill('160000')
  await page.getByLabel('Ano', { exact: true }).fill('2025')
  await page.getByRole('button', { name: 'Aplicar filtros', exact: true }).click()
  await page.getByRole('row').filter({ hasText: 'TESLA-002' }).waitFor({ state: 'hidden' })
  await page.getByRole('row').filter({ hasText: 'TESLA-003' }).waitFor()
  await capture('04-filtros.png', 'Filtros combinados', 'Situação disponível, ano 2025 e preço entre R$ 140.000 e R$ 160.000 retornam duas unidades.', 810)
  await page.getByRole('button', { name: 'Limpar filtros', exact: true }).click()
  const first = page.getByRole('row').filter({ hasText: 'TESLA-001' })
  await first.getByRole('button', { name: 'Editar TESLA-001', exact: true }).click()
  await page.getByLabel('Preço (R$)', { exact: true }).fill('145000')
  await page.getByLabel('Quilometragem (km)', { exact: true }).fill('500')
  await page.getByLabel('Situação', { exact: true }).selectOption('SOLD')
  const updated = page.waitForResponse(response => response.request().method() === 'PUT' && response.url().startsWith(`${api}/api/vehicles/`))
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click()
  const updateResponse = await updated
  if (updateResponse.status() !== 200) throw new Error('A edição não retornou HTTP 200.')
  operations.push({ method: 'PUT', path: '/api/vehicles/{id}', status: 200, source: 'interface' })
  await first.getByText('Vendido', { exact: true }).waitFor()
  await page.getByText('Conectado', { exact: true }).waitFor()
  await capture('05-atualizacao.png', 'Atualização de preço, quilometragem e situação', 'TESLA-001 passa a R$ 145.000, 500 km e vendido; as demais unidades mantêm seus dados.', 790)
  await first.getByRole('button', { name: 'Excluir TESLA-001', exact: true }).click()
  const removed = page.waitForResponse(response => response.request().method() === 'DELETE' && response.url().startsWith(`${api}/api/vehicles/`))
  await page.getByRole('button', { name: 'Excluir permanentemente', exact: true }).click()
  const deleteResponse = await removed
  if (deleteResponse.status() !== 204) throw new Error('A exclusão não retornou HTTP 204.')
  operations.push({ method: 'DELETE', path: '/api/vehicles/{id}', status: 204, source: 'interface' })
  await first.waitFor({ state: 'hidden' })
  await page.getByRole('row').filter({ hasText: 'TESLA-002' }).waitFor()
  await page.getByText('Conectado', { exact: true }).waitFor()
  await capture('06-exclusao.png', 'Remoção da unidade vendida', 'Após a confirmação, TESLA-001 deixa a lista e permanecem duas unidades disponíveis.', 720)
  const final = await request('vehicles?size=100')
  if (final.totalElements !== 2 || final.content.some(vehicle => vehicle.stockCode === 'TESLA-001')) throw new Error('A exclusão não foi confirmada pela API.')
  if (errors.length) throw new Error(`Falhas no navegador: ${errors.join('; ')}`)
  await writeFile(resolve(root, 'docs/entrega/evidencias.json'), JSON.stringify({
    capturedAt: new Date().toISOString(), data: 'Dados fictícios; capturas reais da interface em esquema temporário isolado.',
    viewport: { width: 1360, height: 1000, deviceScaleFactor: 2 }, screenshots, operations,
    finalUnits: final.content.map(({ stockCode, price, mileage, status }) => ({ stockCode, price, mileage, status })), browserErrors: errors,
  }, null, 2) + '\n')
  console.log('Seis evidências capturadas; cadastro, edição e exclusão confirmados pela API.')
} catch (error) {
  console.error(backendLog.slice(-3500))
  throw error
} finally {
  await browser?.close()
  for (const child of children.reverse()) {
    try { process.kill(-child.pid, 'SIGTERM') } catch {}
    await Promise.race([new Promise(done => child.once('exit', done)), new Promise(done => setTimeout(done, 2000))])
    if (child.exitCode === null) { try { process.kill(-child.pid, 'SIGKILL') } catch {} }
  }
  // The generated identifier is the only schema this command may remove.
  if (!/^report_[a-f0-9]{32}$/.test(schema)) throw new Error('Nome de esquema inválido.')
  try {
    execFileSync('docker', ['exec', 'postgres', 'sh', '-c', 'exec psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d vehicle_inventory_test -c "$1"', 'sh', `DROP SCHEMA IF EXISTS "${schema}" CASCADE`], { stdio: 'pipe' })
  } catch { console.error(`Não foi possível remover o esquema temporário ${schema}.`) }
}
