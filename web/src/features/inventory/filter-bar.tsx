import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/atoms/button'
import { Input } from '@/atoms/input'
import { Label } from '@/atoms/label'
import { NativeSelect, NativeSelectOption } from '@/atoms/native-select'
import * as Icon from '@/icons'
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/molecules/popover'
import { ToolbarMenu } from '@/molecules/toolbar-menu'
import { configurationLabel, emptyFilters, statusLabels } from './types'
import type { Catalog, Filters, Status } from './types'

const labels: Record<keyof Filters, string> = {
  brandId: 'Marca', modelId: 'Modelo', configurationId: 'Configuração', status: 'Situação',
  minPrice: 'Preço mínimo', maxPrice: 'Preço máximo', year: 'Ano', color: 'Cor', specification: 'Especificação', vehicleType: 'Tipo de veículo',
}

export function FilterBar({ filters, catalog, onApply }: { filters: Filters; catalog: Catalog; onApply: (filters: Filters) => void }) {
  const [draft, setDraft] = useState(filters)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const active = (Object.entries(filters) as [keyof Filters, string][]).filter(([, value]) => value)
  const advancedCount = active.filter(([name]) => name !== 'brandId' && name !== 'status').length
  const models = catalog.models.filter(model => !filters.brandId || model.brand.id === Number(filters.brandId))
  const configurations = catalog.configurations.filter(configuration =>
    (!filters.brandId || configuration.model.brand.id === Number(filters.brandId)) && (!draft.modelId || configuration.model.id === Number(draft.modelId)))

  function set(name: keyof Filters, value: string) {
    setDraft(current => ({ ...current, [name]: value, ...(name === 'modelId' ? { configurationId: '' } : {}) }))
  }
  function apply(event: FormEvent) {
    event.preventDefault()
    if (draft.minPrice && draft.maxPrice && Number(draft.minPrice) > Number(draft.maxPrice)) {
      setError('O preço mínimo não pode ser maior que o preço máximo.')
      return
    }
    onApply(draft)
    setOpen(false)
  }
  function remove(name: keyof Filters) {
    onApply({ ...filters, [name]: '', ...(name === 'brandId' ? { modelId: '', configurationId: '' } : {}), ...(name === 'modelId' ? { configurationId: '' } : {}) })
  }
  function valueLabel(name: keyof Filters, value: string) {
    if (name === 'brandId') return catalog.brands.find(brand => brand.id === Number(value))?.name ?? value
    if (name === 'modelId') return catalog.models.find(model => model.id === Number(value))?.name ?? value
    if (name === 'configurationId') {
      const configuration = catalog.configurations.find(configuration => configuration.id === Number(value))
      return configuration ? `${configuration.model.name} · ${configuration.color}` : value
    }
    if (name === 'status') return statusLabels[value as Status]
    return value
  }

  return <div className="grid gap-3" data-slot="inventory-filters">
    <div className="flex flex-wrap items-center gap-2" aria-label="Filtros de estoque">
      <ToolbarMenu label="Marca" icon={Icon.Brand} value={filters.brandId} unset=""
        options={[{ id: '', title: 'Qualquer marca' }, ...catalog.brands.map(brand => ({ id: String(brand.id), title: brand.name }))]}
        onChange={brandId => onApply({ ...filters, brandId, modelId: '', configurationId: '' })} />
      <ToolbarMenu label="Situação" icon={Icon.Available} value={filters.status} unset=""
        options={[{ id: '', title: 'Qualquer situação' }, ...Object.entries(statusLabels).map(([id, title]) => ({ id, title }))]}
        onChange={status => onApply({ ...filters, status })} />
      <Popover open={open} onOpenChange={value => { if (value) { setDraft(filters); setError('') }; setOpen(value) }}>
        <PopoverTrigger render={<Button variant="outline" />}><Icon.Filter className="size-4 text-muted-foreground" />Filtros{advancedCount > 0 && <span className="text-xs tabular-nums text-muted-foreground">{advancedCount}</span>}</PopoverTrigger>
        <PopoverContent align="start" className="max-h-[min(80dvh,44rem)] w-[min(36rem,calc(100vw-2rem))] overflow-y-auto p-4">
          <PopoverHeader><PopoverTitle>Filtrar unidades</PopoverTitle><p className="text-sm text-muted-foreground">Combine as características que deseja consultar.</p></PopoverHeader>
          <form onSubmit={apply} className="grid gap-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2"><Label htmlFor="filter-modelId">Modelo</Label><NativeSelect id="filter-modelId" value={draft.modelId} onChange={event => set('modelId', event.target.value)}>
                <NativeSelectOption value="">Qualquer modelo</NativeSelectOption>{models.map(model => <NativeSelectOption key={model.id} value={model.id}>{model.brand.name} {model.name}</NativeSelectOption>)}
              </NativeSelect></div>
              <div className="grid gap-2"><Label htmlFor="filter-configurationId">Configuração</Label><NativeSelect id="filter-configurationId" value={draft.configurationId} onChange={event => set('configurationId', event.target.value)}>
                <NativeSelectOption value="">Qualquer configuração</NativeSelectOption>{configurations.map(configuration => <NativeSelectOption key={configuration.id} value={configuration.id}>{configurationLabel(configuration)}</NativeSelectOption>)}
              </NativeSelect></div>
              {(['minPrice', 'maxPrice', 'year', 'color', 'specification', 'vehicleType'] as const).map(name => <div className="grid gap-2" key={name}>
                <Label htmlFor={`filter-${name}`}>{labels[name]}</Label>
                <Input id={`filter-${name}`} type={name.endsWith('Price') || name === 'year' ? 'number' : 'text'}
                  min={name === 'year' ? 1886 : name.endsWith('Price') ? 0 : undefined} max={name === 'year' ? 9999 : undefined}
                  step={name.endsWith('Price') ? '0.01' : undefined} maxLength={name === 'specification' ? 100 : 50}
                  value={draft[name]} onChange={event => set(name, event.target.value)} />
              </div>)}
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2 border-t pt-3"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit">Aplicar filtros</Button></div>
          </form>
        </PopoverContent>
      </Popover>
      {active.length > 0 && <Button variant="ghost" onClick={() => onApply(emptyFilters)}><Icon.Close className="size-4" />Limpar filtros</Button>}
    </div>
    {active.length > 0 && <div className="flex flex-wrap gap-2" aria-label="Filtros aplicados">{active.map(([name, value]) => <Button key={name} variant="outline" aria-label={`Remover filtro ${labels[name].toLocaleLowerCase('pt-BR')}`} onClick={() => remove(name)}>
      <span className="text-muted-foreground">{labels[name]}</span><span className="max-w-48 truncate">{valueLabel(name, value)}</span><Icon.Close className="size-3 text-muted-foreground" />
    </Button>)}</div>}
  </div>
}
