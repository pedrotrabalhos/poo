import type { Catalog, Page, Resource } from '@/features/inventory/types'

const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')
const fieldLabels: Record<string, string> = {
  name: 'Nome', brandId: 'Marca', modelId: 'Modelo', configurationId: 'Configuração', color: 'Cor',
  specification: 'Especificação', vehicleType: 'Tipo de veículo', stockCode: 'Código de estoque',
  manufactureYear: 'Ano de fabricação', price: 'Preço', mileage: 'Quilometragem', status: 'Situação',
}
interface ApiProblem { detail?: string; errors?: { field: string; message: string }[] }
function problemMessage(status: number, problem: ApiProblem | null) {
  if (problem?.errors?.length) return problem.errors.map(({ field, message }) => {
    const reason = /must not be (blank|null)/.test(message) ? 'preenchimento obrigatório'
      : /greater than or equal to 0/.test(message) ? 'informe um valor maior ou igual a zero'
      : /numeric value out of bounds/.test(message) ? 'use até 12 dígitos inteiros e 2 casas decimais'
      : /size must be between/.test(message) ? 'o texto ultrapassa o tamanho permitido' : 'revise o valor informado'
    return `${fieldLabels[field] ?? 'Campo'}: ${reason}.`
  }).join(' ')
  if (status === 409) {
    const detail = problem?.detail ?? ''
    if (detail.includes("brand's models")) return 'Esta marca possui modelos vinculados. Remova ou altere esses vínculos antes de excluí-la.'
    if (detail.includes("model's configurations")) return 'Este modelo possui configurações vinculadas. Remova ou altere esses vínculos antes de excluí-lo.'
    if (detail.includes("configuration's stock units")) return 'Esta configuração possui unidades vinculadas. Remova ou altere esses vínculos antes de excluí-la.'
    if (detail.includes('Mark the vehicle')) return 'Marque a unidade como vendida ou descontinuada antes de excluí-la.'
    if (detail.includes('changed during')) return 'O registro foi alterado durante a operação. Atualize a lista e tente novamente.'
    return 'Já existe um registro com esses dados, ou ele possui vínculos que impedem a exclusão.'
  }
  if (status === 404) return 'O registro ou uma de suas referências não foi encontrado. Atualize a lista e tente novamente.'
  if (status === 400) return 'Revise os dados informados e tente novamente.'
  if (status === 403) return 'Não foi possível acessar os dados a partir desta página.'
  return 'Não foi possível concluir a operação. Tente novamente.'
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${baseUrl}/api/${path}`, {
      ...init,
      headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error
    throw new Error('Não foi possível conectar ao servidor. Verifique a conexão e tente novamente.')
  }
  if (response.status === 204) return undefined as T
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(problemMessage(response.status, data))
  return data as T
}
async function all<T>(resource: Resource, signal: AbortSignal): Promise<T[]> {
  const first = await request<Page<T>>(`${resource}?size=100`, { signal })
  const result = [...first.content]
  for (let page = 1; page < first.totalPages; page++) {
    result.push(...(await request<Page<T>>(`${resource}?size=100&page=${page}`, { signal })).content)
  }
  return result
}
export async function loadCatalog(signal: AbortSignal): Promise<Catalog> {
  const [brands, models, configurations] = await Promise.all([
    all<Catalog['brands'][number]>('brands', signal),
    all<Catalog['models'][number]>('models', signal),
    all<Catalog['configurations'][number]>('vehicle-configurations', signal),
  ])
  return { brands, models, configurations }
}
