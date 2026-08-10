import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'
import type { ReactElement, ReactNode } from 'react'

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <BaseTooltip.Provider delay={200}>{children}</BaseTooltip.Provider>
}

interface TooltipProps {
  content: ReactNode
  children: ReactElement
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={8} className="z-50">
          <BaseTooltip.Popup className="rounded-md bg-primary px-2.5 py-1.5 text-xs text-primary-foreground shadow-md">
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  )
}
