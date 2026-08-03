<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import {
  ContextMenuItem,
  type ContextMenuItemEmits,
  type ContextMenuItemProps,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<
  ContextMenuItemProps & { class?: HTMLAttributes['class']; inset?: boolean }
>()
const emits = defineEmits<ContextMenuItemEmits>()
const delegatedProps = computed(() => {
  const { class: _omit, inset: _i, ...delegated } = props
  return delegated
})
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <ContextMenuItem
    v-bind="forwarded"
    data-slot="context-menu-item"
    :class="
      cn(
        `focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[inset]:pl-8`,
        props.class,
      )
    "
    :data-inset="inset ? '' : undefined"
  >
    <slot />
  </ContextMenuItem>
</template>
