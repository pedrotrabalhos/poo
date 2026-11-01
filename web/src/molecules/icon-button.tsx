import type { ComponentProps } from 'react'
import { Button } from '@/atoms/button'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

export function IconButton({ label, ...props }: ComponentProps<typeof Button> & { label: string }) {
  return <Tooltip>
    <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label={label} {...props} />} />
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
}
