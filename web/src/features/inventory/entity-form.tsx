import { useState } from 'react'
import type { FormEvent } from 'react'
import * as Icon from '@/icons'
import { toast } from 'sonner'
import { Button } from '@/atoms/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/molecules/dialog'
import { Input } from '@/atoms/input'
import { Label } from '@/atoms/label'
import { NativeSelect, NativeSelectOption } from '@/atoms/native-select'
import { request } from '@/lib/api'
import { configurationLabel, resources } from './types'
import type { Brand, Catalog, Configuration, InventoryRow, Model, Resource, Vehicle } from './types'

interface Field {
  name: string; label: string; type: 'text' | 'number' | 'select'
  options?: { value: string; label: string }[]; maxLength?: number
  min?: number; max?: number; step?: string
}
function fieldsFor(resource: Resource, catalog: Catalog): Field[] {
  switch (resource) {
    case 'brands': return [{ name: 'name', label: 'Nome da marca', type: 'text', maxLength: 100 }]
    case 'models': return [
      { name: 'brandId', label: 'Marca', type: 'select', options: catalog.brands.map(brand => ({ value: String(brand.id), label: brand.name })) },
      { name: 'name', label: 'Nome do modelo', type: 'text', maxLength: 100 },
    ]
    case 'vehicle-configurations': return [
      { name: 'modelId', label: 'Modelo', type: 'select', options: catalog.models.map(model => ({ value: String(model.id), label: `${model.brand.name} ${model.name}` })) },
      { name: 'color', label: 'Cor', type: 'text', maxLength: 50 },
      { name: 'specification', label: 'Especificação', type: 'text', maxLength: 100 },
      { name: 'vehicleType', label: 'Tipo de veículo', type: 'text', maxLength: 50 },
    ]
    case 'vehicles': return [
      { name: 'configurationId', label: 'Configuração', type: 'select', options: catalog.configurations.map(configuration => ({ value: String(configuration.id), label: configurationLabel(configuration) })) },
      { name: 'stockCode', label: 'Código de estoque', type: 'text', maxLength: 64 },
      { name: 'manufactureYear', label: 'Ano de fabricação', type: 'number', min: 1886, max: 9999, step: '1' },
      { name: 'price', label: 'Preço (R$)', type: 'number', min: 0, max: 999999999999.99, step: '0.01' },
      { name: 'mileage', label: 'Quilometragem (km)', type: 'number', min: 0, step: '1', max: Number.MAX_SAFE_INTEGER },
      { name: 'status', label: 'Situação', type: 'select', options: [
        { value: 'AVAILABLE', label: 'Disponível' }, { value: 'SOLD', label: 'Vendido' }, { value: 'DISCONTINUED', label: 'Descontinuado' },
      ] },
    ]
  }
}
function initialValues(resource: Resource, row: InventoryRow | null): Record<string, string> {
  if (!row) return { manufactureYear: String(new Date().getFullYear()), mileage: '0', status: 'AVAILABLE', vehicleType: 'CARRO' }
  if (resource === 'brands') return { name: (row as Brand).name }
  if (resource === 'models') {
    const model = row as Model
    return { brandId: String(model.brand.id), name: model.name }
  }
  if (resource === 'vehicle-configurations') {
    const configuration = row as Configuration
    return { modelId: String(configuration.model.id), color: configuration.color, specification: configuration.specification, vehicleType: configuration.vehicleType }
  }
  const vehicle = row as Vehicle
  return { configurationId: String(vehicle.configuration.id), stockCode: vehicle.stockCode,
    manufactureYear: String(vehicle.manufactureYear), price: String(vehicle.price), mileage: String(vehicle.mileage), status: vehicle.status }
}

export function EntityForm({ resource, row, catalog, onClose, onSaved }: {
  resource: Resource; row: InventoryRow | null; catalog: Catalog; onClose: () => void; onSaved: () => void
}) {
  const fields = fieldsFor(resource, catalog)
  const [values, setValues] = useState(() => initialValues(resource, row))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const missingOptions = fields.some(field => field.type === 'select' && !field.options?.length)

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    const body = Object.fromEntries(fields.map(field => [field.name,
      field.type === 'number' || field.name.endsWith('Id') ? Number(values[field.name]) : values[field.name]?.trim(),
    ]))
    try {
      await request(`${resource}${row ? `/${row.id}` : ''}`, { method: row ? 'PUT' : 'POST', body: JSON.stringify(body) })
      toast.success(row ? resources[resource].updatedMessage : resources[resource].createdMessage)
      onSaved()
      onClose()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível salvar. Tente novamente.')
    } finally { setBusy(false) }
  }

  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose() }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg" showCloseButton={!busy}>
      <DialogHeader>
        <DialogTitle>{row ? resources[resource].editLabel : resources[resource].createLabel}</DialogTitle>
        <DialogDescription>{resource === 'vehicle-configurations'
          ? 'As alterações serão aplicadas a todas as unidades vinculadas a esta configuração.'
          : resource === 'vehicles' ? 'Cada unidade possui seu próprio código, preço, ano, quilometragem e situação.' : 'Preencha os dados para manter o catálogo organizado.'}</DialogDescription>
      </DialogHeader>
      <form onSubmit={save} className="grid gap-5">
        {missingOptions && <p role="alert" className="rounded-lg border p-3 text-sm text-muted-foreground">Cadastre a marca, o modelo ou a configuração necessários antes de continuar.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(field => <div className={field.type === 'select' && field.name !== 'status' ? 'grid gap-2 sm:col-span-2' : 'grid gap-2'} key={field.name}>
            <Label htmlFor={`field-${field.name}`}>{field.label}</Label>
            {field.type === 'select' ? <NativeSelect id={`field-${field.name}`} className="w-full" required disabled={busy}
              value={values[field.name] ?? ''} onChange={event => setValues(current => ({ ...current, [field.name]: event.target.value }))}>
              <NativeSelectOption value="" disabled>Selecione: {field.label.toLowerCase()}</NativeSelectOption>
              {field.options?.map(option => <NativeSelectOption key={option.value} value={option.value}>{option.label}</NativeSelectOption>)}
            </NativeSelect> : <Input id={`field-${field.name}`} type={field.type} required disabled={busy}
              maxLength={field.maxLength} min={field.min} max={field.max} step={field.step}
              value={values[field.name] ?? ''} onChange={event => setValues(current => ({ ...current, [field.name]: event.target.value }))} />}
          </div>)}
        </div>
        {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button type="submit" disabled={busy || missingOptions}>{busy && <Icon.Loading className="size-4 animate-spin" />} {busy ? 'Salvando…' : 'Salvar alterações'}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
}
