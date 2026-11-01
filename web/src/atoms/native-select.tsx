import type { ComponentProps } from 'react'
import { cn } from 'cn'
import * as Icon from '@/icons'

function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return <div className={cn('relative w-full', className)}>
    <select data-slot="native-select" className="h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent py-1 pr-8 pl-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50" {...props} />
    <Icon.Expand aria-hidden className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
  </div>
}
function NativeSelectOption(props: ComponentProps<'option'>) {
  return <option className="bg-popover text-popover-foreground" {...props} />
}
export { NativeSelect, NativeSelectOption }
