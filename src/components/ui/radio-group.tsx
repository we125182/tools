import { Radio } from '@base-ui/react/radio'
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group'
import { cn } from '@/lib/utils'

export interface RadioOption<Value extends string> {
  value: Value
  label: string
}

interface RadioGroupProps<Value extends string> {
  value: Value
  options: readonly RadioOption<Value>[]
  onValueChange: (value: Value) => void
  'aria-label': string
  className?: string
  disabled?: boolean
}

export function RadioGroup<Value extends string>({
  value,
  options,
  onValueChange,
  disabled,
  className,
  'aria-label': ariaLabel,
}: RadioGroupProps<Value>) {
  return (
    <BaseRadioGroup
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn('flex min-h-8 flex-wrap content-start items-start gap-x-3 gap-y-1.5', className)}
      onValueChange={(nextValue) => onValueChange(nextValue as Value)}
    >
      {options.map((option) => (
        <label key={option.value} className="flex min-h-8 cursor-pointer items-center gap-1.5 text-xs text-foreground has-data-[disabled]:cursor-not-allowed has-data-[disabled]:opacity-50">
          <Radio.Root
            value={option.value}
            className="flex size-4 shrink-0 items-center justify-center rounded-full border text-primary outline-none transition-colors data-[checked]:border-primary focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Radio.Indicator className="size-2 rounded-full bg-current" />
          </Radio.Root>
          <span>{option.label}</span>
        </label>
      ))}
    </BaseRadioGroup>
  )
}
