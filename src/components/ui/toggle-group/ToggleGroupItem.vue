<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import {
  ToggleGroupItem,
  type ToggleGroupItemProps,
  useForwardProps,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { VARIANTS } from './toggle'

const props = defineProps<ToggleGroupItemProps & { class?: HTMLAttributes['class'] }>()
const delegatedProps = computed(() => {
  const { class: _omit, ...delegated } = props
  return delegated
})
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <ToggleGroupItem
    v-bind="forwarded"
    data-slot="toggle-group-item"
    :class="
      cn(
        VARIANTS(),
        'h-8 border border-transparent px-3 shadow-xs first:rounded-l-md last:rounded-r-md data-[state=on]:border-transparent',
        props.class,
      )
    "
  >
    <slot />
  </ToggleGroupItem>
</template>
