<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ContextMenuLabel } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  inset?: boolean
}>()
</script>

<template>
  <ContextMenuLabel
    data-slot="context-menu-label"
    :data-inset="inset ? '' : undefined"
    :class="
      cn(
        'px-2 py-1.5 text-sm font-medium data-[inset]:pl-8',
        props.class,
      )
    "
  >
    <slot />
  </ContextMenuLabel>
</template>
