import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/atoms/button'
import { Badge } from '@/atoms/badge'
import { Skeleton } from '@/atoms/skeleton'
import * as Icon from '@/icons'
import { HeaderLayout } from '@/layouts/header-layout'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/molecules/dialog'
import { EmptyState } from '@/molecules/empty-state'
import { IconButton } from '@/molecules/icon-button'
import { PageHeader } from '@/molecules/page-header'
import { SearchField } from '@/molecules/search-field'
import { Toaster } from '@/molecules/sonner'
import { TooltipProvider } from '@/molecules/tooltip'
import { TabItem } from '@/organisms/tab-bar'
import { EntityForm } from '@/features/inventory/entity-form'
import { FilterBar } from '@/features/inventory/filter-bar'
import { InventoryTable } from '@/features/inventory/inventory-table'
import { emptyFilters, resources, rowLabel } from '@/features/inventory/types'
import type { Catalog, Configuration, Filters, InventoryRow, Page, Resource, Vehicle } from '@/features/inventory/types'
import { loadCatalog, request } from '@/lib/api'

const navigation = [
  { resource: 'vehicles', label: 'Estoque', icon: Icon.Inventory },
  { resource: 'vehicle-configurations', label: 'Configurações', icon: Icon.Configuration },
  { resource: 'brands', label: 'Marcas', icon: Icon.Brand },
  { resource: 'models', label: 'Modelos', icon: Icon.Model },
] as const
function currentResource(): Resource {
  const hash = window.location.hash.slice(1)
  return Object.hasOwn(resources, hash) ? hash as Resource : 'vehicles'
}
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Não foi possível concluir a operação. Tente novamente.'
const pageSize = 10
const integer = new Intl.NumberFormat('pt-BR')

export default function App() {
  const [resource, setResource] = useState(currentResource)
  const [revision, setRevision] = useState(0)
  const [catalog, setCatalog] = useState<Catalog>({ brands: [], models: [], configurations: [] })
  const [counts, setCounts] = useState<{ total: number; available: number; sold: number } | null>(null)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [units, setUnits] = useState<Page<Vehicle> | null>(null)
  const [unitsLoading, setUnitsLoading] = useState(true)
  const [unitsError, setUnitsError] = useState('')
  const [editor, setEditor] = useState<{ resource: Resource; row: InventoryRow | null } | null>(null)
  const [deleting, setDeleting] = useState<{ resource: Resource; row: InventoryRow } | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [busy, setBusy] = useState(false)
  const refresh = () => setRevision(current => current + 1)

  useEffect(() => { document.title = `${resources[resource].title} · Gestão de veículos` }, [resource])

  useEffect(() => {
    const update = () => { setResource(currentResource()); setPage(0); setSearch('') }
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setCatalogLoading(true)
    setCatalogError('')
    Promise.all([
      loadCatalog(controller.signal),
      request<Page<Vehicle>>('vehicles?size=1', { signal: controller.signal }),
      request<Page<Vehicle>>('vehicles?size=1&status=AVAILABLE', { signal: controller.signal }),
      request<Page<Vehicle>>('vehicles?size=1&status=SOLD', { signal: controller.signal }),
    ]).then(([data, total, available, sold]) => {
      setCatalog(data)
      setCounts({ total: total.totalElements, available: available.totalElements, sold: sold.totalElements })
    }).catch(error => { if (!controller.signal.aborted) setCatalogError(errorMessage(error)) })
      .finally(() => { if (!controller.signal.aborted) setCatalogLoading(false) })
    return () => controller.abort()
  }, [revision])

  useEffect(() => {
    if (resource !== 'vehicles') return
    const controller = new AbortController()
    const params = new URLSearchParams({ page: String(page), size: String(pageSize) })
    Object.entries(filters).forEach(([name, value]) => { if (value.trim()) params.set(name, value.trim()) })
    setUnitsLoading(true)
    setUnitsError('')
    request<Page<Vehicle>>(`vehicles?${params}`, { signal: controller.signal }).then(result => {
      if (page > 0 && page >= result.totalPages) setPage(Math.max(0, result.totalPages - 1))
      else setUnits(result)
    }).catch(error => { if (!controller.signal.aborted) setUnitsError(errorMessage(error)) })
      .finally(() => { if (!controller.signal.aborted) setUnitsLoading(false) })
    return () => controller.abort()
  }, [resource, filters, page, revision])

  function applyFilters(next: Filters) { setFilters(next); setPage(0) }
  function viewUnits(configuration: Configuration) {
    applyFilters({ ...emptyFilters, configurationId: String(configuration.id) })
    window.location.hash = 'vehicles'
  }
  async function markSold(vehicle: Vehicle) {
    setBusy(true)
    try {
      await request(`vehicles/${vehicle.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'SOLD' }) })
      toast.success(`Unidade ${vehicle.stockCode} marcada como vendida.`)
      refresh()
    } catch (error) { toast.error(errorMessage(error)) }
    finally { setBusy(false) }
  }
  async function remove() {
    if (!deleting || busy) return
    setBusy(true)
    setDeleteError('')
    try {
      await request(`${deleting.resource}/${deleting.row.id}`, { method: 'DELETE' })
      toast.success(resources[deleting.resource].removedMessage)
      setDeleting(null)
      refresh()
    } catch (error) { setDeleteError(errorMessage(error)) }
    finally { setBusy(false) }
  }

  const rawCatalogRows: InventoryRow[] = resource === 'brands' ? catalog.brands
    : resource === 'models' ? catalog.models : resource === 'vehicle-configurations' ? catalog.configurations : []
  const catalogRows = rawCatalogRows.filter(row => rowLabel(resource, row).toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')))
  const total = resource === 'vehicles' ? units?.totalElements ?? 0 : catalogRows.length
  const totalPages = resource === 'vehicles' ? units?.totalPages ?? 0 : Math.ceil(total / pageSize)
  const displayPage = resource === 'vehicles' ? page : Math.min(page, Math.max(0, totalPages - 1))
  const rows = resource === 'vehicles' ? units?.content ?? [] : catalogRows.slice(displayPage * pageSize, (displayPage + 1) * pageSize)
  const loading = resource === 'vehicles' ? unitsLoading : catalogLoading
  const loadError = catalogError || (resource === 'vehicles' ? unitsError : '')
  const setupResource: Resource | null = !catalog.brands.length ? 'brands' : !catalog.models.length ? 'models' : !catalog.configurations.length ? 'vehicle-configurations' : null
  const missingDependency = resource === 'models' && !catalog.brands.length || resource === 'vehicle-configurations' && !catalog.models.length || resource === 'vehicles' && !catalog.configurations.length

  const hasFilters = Object.values(filters).some(Boolean)
  const hasMatchesFilter = resource === 'vehicles' ? hasFilters : !!search
  const creation = <Button disabled={catalogLoading || !!catalogError || missingDependency}
    onClick={() => setEditor({ resource, row: null })}><Icon.Add className="size-4" />{resources[resource].createLabel}</Button>
  const prerequisiteAction = missingDependency && setupResource ? <Button variant="outline" onClick={() => {
    window.location.hash = setupResource
    setEditor({ resource: setupResource, row: null })
  }}><Icon.Add className="size-4" />{resources[setupResource].createLabel}</Button> : creation

  return <TooltipProvider>
    <a className="sr-only fixed top-2 left-2 z-100 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only" href="#main"
      onClick={event => { event.preventDefault(); document.getElementById('main')?.focus() }}>Ir para o conteúdo</a>
    <HeaderLayout
      brand={<nav aria-label="Localização" className="flex min-w-0 items-center gap-2 text-sm">
        <Icon.Inventory aria-hidden className="size-5 shrink-0" />
        <a href="#vehicles" className="truncate font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">Gestão de veículos</a>
        <span aria-hidden className="hidden text-muted-foreground/50 sm:inline">/</span>
        <span className="hidden truncate text-muted-foreground sm:inline">{resources[resource].title}</span>
      </nav>}
      actions={<>
        <span role="status" className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
          {catalogLoading ? <Icon.Loading className="size-3.5 animate-spin" /> : catalogError ? <Icon.Error className="size-3.5" /> : <Icon.Success className="size-3.5" />}
          {catalogLoading ? 'Atualizando dados…' : catalogError ? 'Sem conexão' : 'Conectado'}
        </span>
        <IconButton label="Atualizar dados" disabled={catalogLoading || unitsLoading && resource === 'vehicles'} onClick={refresh}><Icon.Refresh className="size-4" /></IconButton>
      </>}
      tabs={navigation.map(item => <TabItem key={item.resource} href={`#${item.resource}`} aria-current={resource === item.resource ? 'page' : undefined}
        icon={<item.icon className="size-4" />}>{item.label}</TabItem>)}
    >
      <PageHeader title={resources[resource].title} description={resources[resource].description} actions={creation} />

      {resource === 'vehicles' && <section aria-label="Resumo de todo o estoque">
        {catalogLoading ? <div role="status" aria-label="Carregando resumo do estoque" aria-busy="true" className="grid grid-cols-2 gap-6 md:grid-cols-4">{[0, 1, 2, 3].map(index => <div className="grid gap-3" key={index}><Skeleton className="h-4 w-28" /><Skeleton className="h-8 w-14" /></div>)}</div>
          : <dl className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[{ label: 'Total de unidades', value: counts?.total, icon: Icon.Inventory },
              { label: 'Disponíveis', value: counts?.available, icon: Icon.Available },
              { label: 'Vendidos', value: counts?.sold, icon: Icon.Sold },
              { label: 'Descontinuados', value: counts ? counts.total - counts.available - counts.sold : undefined, icon: Icon.Empty }].map(stat => <div className="grid gap-2" key={stat.label}>
                <dt className="flex items-center gap-2 text-sm text-muted-foreground"><stat.icon className="size-4" />{stat.label}</dt>
                <dd className="text-2xl font-semibold tabular-nums">{catalogError || stat.value === undefined ? '—' : integer.format(stat.value)}</dd>
              </div>)}
          </dl>}
        <p className="mt-3 text-xs text-muted-foreground">Os totais consideram todas as configurações, independentemente dos filtros.</p>
      </section>}

      {loadError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <span>{loadError}</span><Button variant="outline" onClick={refresh}><Icon.Refresh className="size-4" />Tentar novamente</Button>
      </div>}

      <section aria-label={resource === 'vehicles' ? 'Unidades em estoque' : `Lista de ${resources[resource].title.toLocaleLowerCase('pt-BR')}`} className="grid min-w-0 gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-medium">{resource === 'vehicles' ? 'Unidades em estoque' : 'Cadastros'}<Badge variant="secondary" className="tabular-nums">{loadError ? '—' : integer.format(total)}</Badge></h2>
          {resource !== 'vehicles' && <SearchField label={resources[resource].title.toLocaleLowerCase('pt-BR')} value={search} onChange={value => { setSearch(value); setPage(0) }} />}
        </div>
        {resource === 'vehicles' && <FilterBar key={JSON.stringify(filters)} filters={filters} catalog={catalog} onApply={applyFilters} />}
        {loading ? <div role="status" aria-label="Carregando registros" aria-busy="true" className="grid gap-3 rounded-xl border p-4">{[0, 1, 2, 3].map(index => <Skeleton className="h-12 w-full" key={index} />)}</div>
          : loadError ? <EmptyState icon={Icon.Error} title="Não foi possível carregar os registros" description="Verifique a conexão e tente atualizar os dados novamente." />
          : rows.length ? <InventoryTable resource={resource} rows={rows} catalog={catalog} busy={busy} onEdit={row => setEditor({ resource, row })}
            onDelete={row => { setDeleteError(''); setDeleting({ resource, row }) }} onSold={markSold} onViewUnits={viewUnits} />
          : <EmptyState icon={Icon.Empty} title={hasMatchesFilter ? 'Nenhum resultado encontrado' : ({ vehicles: 'Nenhuma unidade cadastrada', brands: 'Nenhuma marca cadastrada', models: 'Nenhum modelo cadastrado', 'vehicle-configurations': 'Nenhuma configuração cadastrada' }[resource])}
            description={hasMatchesFilter ? 'Ajuste os filtros ou a busca para encontrar outros registros.' : missingDependency ? 'Cadastre primeiro a marca, o modelo e a configuração para adicionar unidades ao estoque.' : 'Adicione o primeiro registro para começar a organizar o estoque.'}
            action={hasMatchesFilter ? <Button variant="outline" onClick={() => { applyFilters(emptyFilters); setSearch('') }}>Limpar {resource === 'vehicles' ? 'filtros' : 'busca'}</Button> : prerequisiteAction} />}
        {!loadError && <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>{loading ? 'Carregando…' : total === 0 ? 'Nenhum registro' : `${integer.format(displayPage * pageSize + 1)}–${integer.format(Math.min((displayPage + 1) * pageSize, total))} de ${integer.format(total)} registros`}</p>
          <div className="flex items-center gap-2"><span className="mr-2">Página {totalPages ? displayPage + 1 : 0} de {totalPages}</span>
            <IconButton variant="outline" label="Página anterior" disabled={loading || displayPage === 0} onClick={() => setPage(displayPage - 1)}><Icon.Back className="size-4" /></IconButton>
            <IconButton variant="outline" label="Próxima página" disabled={loading || displayPage + 1 >= totalPages} onClick={() => setPage(displayPage + 1)}><Icon.Next className="size-4" /></IconButton>
          </div>
        </div>}
      </section>
    </HeaderLayout>
    {editor && <EntityForm key={`${editor.resource}-${editor.row?.id ?? 'new'}`} resource={editor.resource} row={editor.row} catalog={catalog} onClose={() => setEditor(null)} onSaved={refresh} />}
    <Dialog open={!!deleting} onOpenChange={open => { if (!open && !busy) setDeleting(null) }}>
      <DialogContent showCloseButton={!busy}>
        <DialogHeader><DialogTitle>Excluir {deleting ? resources[deleting.resource].singular : 'registro'}?</DialogTitle><DialogDescription>
          O registro {deleting && <strong className="font-medium text-foreground">{rowLabel(deleting.resource, deleting.row)}</strong>} será excluído permanentemente. Esta ação não pode ser desfeita.
        </DialogDescription></DialogHeader>
        {deleteError && <p role="alert" className="text-sm text-destructive">{deleteError}</p>}
        <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>Cancelar</Button>
          <Button variant="destructive" disabled={busy} onClick={remove}>{busy && <Icon.Loading className="size-4 animate-spin" />}Excluir permanentemente</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Toaster theme="light" richColors position="bottom-right" />
  </TooltipProvider>
}
