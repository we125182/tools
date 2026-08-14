import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Kbd({ className, ...props }: ComponentProps<'kbd'>) {
  return <kbd data-slot="kbd" className={cn('inline-flex h-5 shrink-0 items-center rounded-sm border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground', className)} {...props} />
}
