import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const api = 'http://localhost:18080/api'

test('manages catalog, shared configurations and stock units through the real API', async ({ page, request }) => {
  const prefix = `E2E-${randomUUID().slice(0, 8).toUpperCase()}`
  const created: Record<string, number[]> = { brands: [], models: [], 'vehicle-configurations': [], vehicles: [] }
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))

  async function navigate(label: string) {
    await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: label, exact: true }).click()
    await expect(page.getByRole('heading', { name: label, exact: true, level: 1 })).toBeVisible()
  }
  async function create(resource: string, singular: string, fill: (page: Page) => Promise<void>) {
    await page.getByRole('button', { name: singular, exact: true }).first().click()
    await fill(page)
    const response = page.waitForResponse(response => response.url() === `${api}/${resource}` && response.request().method() === 'POST')
    await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click()
    const saved = await response
    expect(saved.status()).toBe(201)
    const data = await saved.json()
    created[resource].push(data.id)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    return data
  }

  try {
    await page.goto('/#brands')
    await expect(page.getByRole('complementary')).toHaveCount(0)
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
    expect(await page.locator('body').evaluate(element => getComputedStyle(element).fontFamily)).toContain('Plus Jakarta Sans Variable')
    expect(await page.getByRole('main').evaluate(element => getComputedStyle(element).overflowY)).toBe('auto')
    await create('brands', 'Nova marca', async page => { await page.getByLabel('Nome da marca', { exact: true }).fill(prefix) })
    await navigate('Modelos')
    await create('models', 'Novo modelo', async page => {
      await page.getByLabel('Marca', { exact: true }).selectOption({ label: prefix })
      await page.getByLabel('Nome do modelo', { exact: true }).fill('Model 3')
    })
    await navigate('Configurações')
    for (const color of ['PRETO', 'BRANCO']) {
      await create('vehicle-configurations', 'Nova configuração', async page => {
        await page.getByLabel('Modelo', { exact: true }).selectOption({ label: `${prefix} Model 3` })
        await page.getByLabel('Cor', { exact: true }).fill(color)
        await page.getByLabel('Especificação', { exact: true }).fill('200V')
      })
    }
    await navigate('Estoque')
    for (const code of [`${prefix}-001`, `${prefix}-002`]) {
      await create('vehicles', 'Nova unidade', async page => {
        await page.getByLabel('Configuração', { exact: true }).selectOption({ label: `${prefix} Model 3 · PRETO · 200V · Carro` })
        await page.getByLabel('Código de estoque', { exact: true }).fill(code)
        await page.getByLabel('Preço (R$)', { exact: true }).fill('150000')
      })
    }
    await page.getByRole('button', { name: 'Marca', exact: true }).click()
    await page.getByRole('menuitemradio', { name: prefix, exact: true }).click()
    const first = page.getByRole('row').filter({ hasText: `${prefix}-001` })
    const second = page.getByRole('row').filter({ hasText: `${prefix}-002` })
    await expect(first).toBeVisible()
    await expect(second).toBeVisible()
    await expect(first.getByRole('button', { name: `Excluir ${prefix}-001`, exact: true })).toBeDisabled()
    await page.getByRole('button', { name: 'Filtros', exact: true }).click()
    await page.getByLabel('Preço mínimo', { exact: true }).fill('200')
    await page.getByLabel('Preço máximo', { exact: true }).fill('100')
    await page.getByRole('button', { name: 'Aplicar filtros', exact: true }).click()
    await expect(page.getByRole('alert')).toHaveText('O preço mínimo não pode ser maior que o preço máximo.')
    await page.getByLabel('Preço mínimo', { exact: true }).fill('145000')
    await page.getByLabel('Preço máximo', { exact: true }).fill('155000')
    await page.getByRole('button', { name: 'Aplicar filtros', exact: true }).click()
    await expect(first).toBeVisible()
    await expect(second).toBeVisible()
    await page.screenshot({ path: 'test-results/inventory-desktop.png', fullPage: true })

    await navigate('Marcas')
    await page.getByRole('searchbox', { name: 'Buscar marcas', exact: true }).fill(prefix)
    await page.getByRole('button', { name: `Excluir ${prefix}`, exact: true }).click()
    await page.getByRole('button', { name: 'Excluir permanentemente', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('Esta marca possui modelos vinculados.')
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
    await navigate('Estoque')

    await first.getByRole('button', { name: `Editar ${prefix}-001`, exact: true }).click()
    await page.getByLabel('Preço (R$)', { exact: true }).fill('145000')
    await page.getByLabel('Quilometragem (km)', { exact: true }).fill('500')
    await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(first).toContainText('145.000,00')
    await expect(second).toContainText('150.000,00')

    await first.getByRole('button', { name: `Marcar ${prefix}-001 como vendido`, exact: true }).click()
    await expect(first).toContainText('Vendido')
    await first.getByRole('button', { name: `Excluir ${prefix}-001`, exact: true }).click()
    await page.getByRole('button', { name: 'Excluir permanentemente', exact: true }).click()
    await expect(first).toHaveCount(0)
    await expect(second).toBeVisible()

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByRole('heading', { name: 'Estoque', exact: true, level: 1 })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy()
    await page.screenshot({ path: 'test-results/inventory-mobile.png', fullPage: true })
    expect(errors).toEqual([])
  } finally {
    for (const id of created.vehicles) {
      await request.patch(`${api}/vehicles/${id}`, { data: { status: 'DISCONTINUED' } })
      await request.delete(`${api}/vehicles/${id}`)
    }
    for (const resource of ['vehicle-configurations', 'models', 'brands']) {
      for (const id of created[resource]) await request.delete(`${api}/${resource}/${id}`)
    }
  }
})

test('shows a recoverable connection error rather than fake inventory data', async ({ page }) => {
  await page.route('http://localhost:18080/api/**', route => route.abort())
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('Não foi possível conectar ao servidor')
  await expect(page.getByRole('button', { name: 'Tentar novamente', exact: true })).toBeVisible()
  await expect(page.getByText('Não foi possível carregar os registros', { exact: true })).toBeVisible()
  await page.unroute('http://localhost:18080/api/**')
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByText('Conectado', { exact: true })).toBeVisible()
})
