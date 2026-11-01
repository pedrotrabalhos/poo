import type { ComponentType, SVGAttributes } from 'react'

/** Provider-neutral props. Sizes and colors come exclusively from className. */
export type IconProps = Pick<SVGAttributes<SVGElement>, 'aria-hidden' | 'aria-label' | 'className' | 'role' | 'style'>
export type IconComponent = ComponentType<IconProps>
export type IconName =
  | 'Add' | 'Close' | 'Delete' | 'Edit' | 'Filter' | 'Search' | 'Refresh'
  | 'Check' | 'Error' | 'Loading' | 'Success' | 'Info' | 'Warning'
  | 'Expand' | 'Submenu' | 'Back' | 'Next' | 'OpenExternal'
  | 'Inventory' | 'Configuration' | 'Brand' | 'Model' | 'Available' | 'Sold' | 'Empty'
export type IconSet = Record<IconName, IconComponent>
