import type { IconName, IconSet } from './contract'
import type * as lucide from './lucide'

type Provider<T extends IconSet> = T
type NoExtras<T extends never> = T
export type Checked = [Provider<typeof lucide>, NoExtras<Exclude<keyof typeof lucide, IconName>>]
