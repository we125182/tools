import { ContextMenu as BaseContextMenu } from '@base-ui/react/context-menu'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const ContextMenu = BaseContextMenu.Root
export const ContextMenuTrigger = BaseContextMenu.Trigger

interface ContextMenuContentProps extends ComponentProps<typeof BaseContextMenu.Popup> {
  sideOffset?: number
}

export function ContextMenuContent({ className, sideOffset = 4, ...props }: ContextMenuContentProps) {
  return (
    <BaseContextMenu.Portal>
      <BaseContextMenu.Positioner sideOffset={sideOffset} className="z-50 outline-none">
        <BaseContextMenu.Popup
          className={cn(
            'min-w-36 origin-[var(--transform-origin)] rounded-md border bg-popover p-1 text-sm text-popover-foreground shadow-lg outline-none transition-[transform,opacity] duration-100 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0',
            className,
          )}
          {...props}
        />
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  )
}

export function ContextMenuItem({ className, ...props }: ComponentProps<typeof BaseContextMenu.Item>) {
  return (
    <BaseContextMenu.Item
      className={cn(
        'flex h-8 w-full cursor-default items-center gap-2 rounded-sm px-2 text-left outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
