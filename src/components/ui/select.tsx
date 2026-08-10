import { Select as BaseSelect } from '@base-ui/react/select'
import { Check, ChevronDown } from 'lucide-react'

export interface SelectOption<Value extends string> {
  value: Value
  label: string
}

interface SelectProps<Value extends string> {
  value: Value
  options: readonly SelectOption<Value>[]
  onValueChange: (value: Value) => void
  'aria-label': string
  disabled?: boolean
  className?: string
}

export function Select<Value extends string>({
  value,
  options,
  onValueChange,
  disabled,
  className,
  'aria-label': ariaLabel,
}: SelectProps<Value>) {
  return (
    <BaseSelect.Root
      value={value}
      items={options}
      disabled={disabled}
      onValueChange={(nextValue) => {
        if (nextValue) onValueChange(nextValue as Value)
      }}
    >
      <BaseSelect.Trigger
        aria-label={ariaLabel}
        className={`flex h-8 min-w-20 items-center justify-between gap-1 rounded-md border bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${className ?? ''}`}
      >
        <BaseSelect.Value />
        <BaseSelect.Icon><ChevronDown size={14} /></BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={6} className="z-50">
          <BaseSelect.Popup className="min-w-(--anchor-width) overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            <BaseSelect.List>
              {options.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  className="flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-xs outline-none data-[highlighted]:bg-accent"
                >
                  <BaseSelect.ItemIndicator><Check size={14} /></BaseSelect.ItemIndicator>
                  <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
