import { Badge } from '@/atoms/badge'
import * as Icon from '@/icons'
import { IconButton } from '@/molecules/icon-button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/molecules/table'
import { rowLabel, statusLabels, vehicleTypeLabel } from './types'
import type { Brand, Catalog, Configuration, InventoryRow, Model, Resource, Vehicle } from './types'

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const integer = new Intl.NumberFormat('pt-BR')
export function InventoryTable({ resource, rows, catalog, busy, onEdit, onDelete, onSold, onViewUnits }: {
  resource: Resource; rows: InventoryRow[]; catalog: Catalog; busy: boolean
  onEdit: (row: InventoryRow) => void; onDelete: (row: InventoryRow) => void
  onSold: (row: Vehicle) => void; onViewUnits: (row: Configuration) => void
}) {
  const headers = resource === 'vehicles' ? ['Veículo', 'Configuração', 'Ano', 'Preço', 'Quilometragem', 'Situação']
    : resource === 'vehicle-configurations' ? ['Modelo', 'Cor', 'Especificação', 'Tipo de veículo']
    : resource === 'models' ? ['Modelo', 'Marca', 'Configurações'] : ['Marca', 'Modelos']
  return <div className="overflow-hidden rounded-xl border" data-slot="inventory-table">
    <Table>
      <TableHeader><TableRow className="hover:bg-transparent">{headers.map(header => <TableHead key={header} className="px-4 text-xs text-muted-foreground">{header}</TableHead>)}<TableHead className="px-4 text-right text-xs text-muted-foreground">Ações</TableHead></TableRow></TableHeader>
      <TableBody>{rows.map(row => {
        const label = rowLabel(resource, row)
        const removable = resource !== 'vehicles' || (row as Vehicle).status !== 'AVAILABLE'
        return <TableRow key={row.id}>
          {resource === 'vehicles' && <UnitCells vehicle={row as Vehicle} />}
          {resource === 'vehicle-configurations' && <ConfigurationCells configuration={row as Configuration} />}
          {resource === 'brands' && <><TableCell className="px-4 py-4 font-medium">{(row as Brand).name}</TableCell><TableCell className="px-4 tabular-nums">{integer.format(catalog.models.filter(model => model.brand.id === row.id).length)}</TableCell></>}
          {resource === 'models' && <><TableCell className="px-4 py-4 font-medium">{(row as Model).name}</TableCell><TableCell className="px-4">{(row as Model).brand.name}</TableCell><TableCell className="px-4 tabular-nums">{integer.format(catalog.configurations.filter(configuration => configuration.model.id === row.id).length)}</TableCell></>}
          <TableCell className="px-3"><div className="flex justify-end gap-1">
            {resource === 'vehicle-configurations' && <IconButton label={`Ver unidades: ${label}`} onClick={() => onViewUnits(row as Configuration)}><Icon.OpenExternal className="size-4" /></IconButton>}
            {resource === 'vehicles' && (row as Vehicle).status === 'AVAILABLE' && <IconButton disabled={busy} label={`Marcar ${label} como vendido`} onClick={() => onSold(row as Vehicle)}><Icon.Sold className="size-4" /></IconButton>}
            <IconButton disabled={busy} label={`Editar ${label}`} onClick={() => onEdit(row)}><Icon.Edit className="size-4" /></IconButton>
            <IconButton disabled={busy || !removable} label={`Excluir ${label}`} title={removable ? undefined : 'Marque como vendido ou descontinuado antes de excluir'} onClick={() => onDelete(row)}><Icon.Delete className="size-4" /></IconButton>
          </div></TableCell>
        </TableRow>
      })}</TableBody>
    </Table>
  </div>
}
function UnitCells({ vehicle }: { vehicle: Vehicle }) {
  return <>
    <TableCell className="px-4 py-4"><span className="font-medium">{vehicle.configuration.model.brand.name} {vehicle.configuration.model.name}</span><div className="mt-1 text-xs text-muted-foreground">{vehicle.stockCode}</div></TableCell>
    <TableCell className="px-4"><span>{vehicle.configuration.color}</span><div className="mt-1 text-xs text-muted-foreground">{vehicle.configuration.specification} · {vehicleTypeLabel(vehicle.configuration.vehicleType)}</div></TableCell>
    <TableCell className="px-4 tabular-nums">{vehicle.manufactureYear}</TableCell>
    <TableCell className="px-4 font-medium tabular-nums">{money.format(vehicle.price)}</TableCell>
    <TableCell className="px-4 tabular-nums">{integer.format(vehicle.mileage)} km</TableCell>
    <TableCell className="px-4"><Badge variant={vehicle.status === 'AVAILABLE' ? 'secondary' : 'outline'} className="gap-1.5 font-normal"><span className={`size-1.5 rounded-full ${vehicle.status === 'AVAILABLE' ? 'bg-foreground' : 'bg-muted-foreground/50'}`} />{statusLabels[vehicle.status]}</Badge></TableCell>
  </>
}
function ConfigurationCells({ configuration }: { configuration: Configuration }) {
  return <>
    <TableCell className="px-4 py-4"><span className="font-medium">{configuration.model.brand.name} {configuration.model.name}</span><div className="mt-1 text-xs text-muted-foreground">Configuração #{configuration.id}</div></TableCell>
    <TableCell className="px-4">{configuration.color}</TableCell><TableCell className="px-4">{configuration.specification}</TableCell><TableCell className="px-4">{vehicleTypeLabel(configuration.vehicleType)}</TableCell>
  </>
}
