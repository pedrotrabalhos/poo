export type Status = 'AVAILABLE' | 'SOLD' | 'DISCONTINUED'
export type Resource = 'vehicles' | 'vehicle-configurations' | 'brands' | 'models'
export interface Brand { id: number; name: string }
export interface Model { id: number; name: string; brand: Brand }
export interface Configuration {
  id: number; model: Model; color: string; specification: string; vehicleType: string
}
export interface Vehicle {
  id: number; stockCode: string; configuration: Configuration
  manufactureYear: number; price: number; mileage: number; status: Status
}
export type InventoryRow = Brand | Model | Configuration | Vehicle
export interface Page<T> {
  content: T[]; page: number; size: number; totalElements: number; totalPages: number
}
export interface Catalog { brands: Brand[]; models: Model[]; configurations: Configuration[] }
export interface Filters {
  brandId: string; modelId: string; configurationId: string; status: string
  minPrice: string; maxPrice: string; year: string; color: string; specification: string; vehicleType: string
}
export const emptyFilters: Filters = {
  brandId: '', modelId: '', configurationId: '', status: '', minPrice: '', maxPrice: '',
  year: '', color: '', specification: '', vehicleType: '',
}
export const statusLabels: Record<Status, string> = {
  AVAILABLE: 'Disponível', SOLD: 'Vendido', DISCONTINUED: 'Descontinuado',
}
export const resources: Record<Resource, {
  title: string; singular: string; description: string; createLabel: string; editLabel: string
  createdMessage: string; updatedMessage: string; removedMessage: string
}> = {
  vehicles: {
    title: 'Estoque', singular: 'unidade', description: 'Acompanhe os veículos, os preços e a disponibilidade de cada unidade.',
    createLabel: 'Nova unidade', editLabel: 'Editar unidade', createdMessage: 'Unidade cadastrada.', updatedMessage: 'Unidade atualizada.', removedMessage: 'Unidade excluída.',
  },
  'vehicle-configurations': {
    title: 'Configurações', singular: 'configuração', description: 'Defina as características compartilhadas pelas unidades do estoque.',
    createLabel: 'Nova configuração', editLabel: 'Editar configuração', createdMessage: 'Configuração cadastrada.', updatedMessage: 'Configuração atualizada.', removedMessage: 'Configuração excluída.',
  },
  brands: {
    title: 'Marcas', singular: 'marca', description: 'Cadastre as fabricantes dos veículos que você comercializa.',
    createLabel: 'Nova marca', editLabel: 'Editar marca', createdMessage: 'Marca cadastrada.', updatedMessage: 'Marca atualizada.', removedMessage: 'Marca excluída.',
  },
  models: {
    title: 'Modelos', singular: 'modelo', description: 'Organize os modelos e suas respectivas marcas.',
    createLabel: 'Novo modelo', editLabel: 'Editar modelo', createdMessage: 'Modelo cadastrado.', updatedMessage: 'Modelo atualizado.', removedMessage: 'Modelo excluído.',
  },
}
export function vehicleTypeLabel(type: string) {
  return ({ CAR: 'Carro', CARRO: 'Carro', MOTORCYCLE: 'Moto', TRUCK: 'Caminhão' } as Record<string, string>)[type] ?? type
}
export function configurationLabel(configuration: Configuration) {
  return `${configuration.model.brand.name} ${configuration.model.name} · ${configuration.color} · ${configuration.specification} · ${vehicleTypeLabel(configuration.vehicleType)}`
}
export function rowLabel(resource: Resource, row: InventoryRow) {
  if (resource === 'vehicles') return (row as Vehicle).stockCode
  if (resource === 'vehicle-configurations') return configurationLabel(row as Configuration)
  return (row as Brand | Model).name
}
