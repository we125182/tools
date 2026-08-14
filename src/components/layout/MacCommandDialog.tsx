import type { LucideIcon } from 'lucide-react'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Kbd } from '@/components/ui/kbd'

export type MacCommandAction = {
  id: string
  label: string
  keywords: string[]
  icon: LucideIcon
  onSelect: () => void
}

type MacCommandDialogProps = {
  appearanceCommands: MacCommandAction[]
  onOpenChange: (open: boolean) => void
  open: boolean
  toolCommands: MacCommandAction[]
}

export function MacCommandDialog({ appearanceCommands, onOpenChange, open, toolCommands }: MacCommandDialogProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} label="命令面板">
      <CommandInput placeholder="输入命令或搜索..." aria-label="搜索命令" />
      <CommandList>
        <CommandEmpty>未找到命令。</CommandEmpty>
        <CommandGroup heading="工具">
          {toolCommands.map((command) => {
            const Icon = command.icon
            return (
              <CommandItem key={command.id} value={command.label} keywords={command.keywords} onSelect={command.onSelect}>
                <Icon />
                <span>{command.label}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="界面">
          {appearanceCommands.map((command) => {
            const Icon = command.icon
            return (
              <CommandItem key={command.id} value={command.label} keywords={command.keywords} onSelect={command.onSelect}>
                <Icon />
                <span>{command.label}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
      <CommandSeparator />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><Kbd>esc</Kbd>关闭</span>
        <span className="flex items-center gap-1.5"><Kbd>↵</Kbd>选择</span>
        <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd>导航</span>
      </div>
    </CommandDialog>
  )
}
