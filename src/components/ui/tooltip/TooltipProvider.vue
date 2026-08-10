<script setup lang="ts">
import {
  TooltipProvider,
  type TooltipProviderProps,
  useForwardProps,
} from 'reka-ui'

const props = withDefaults(defineProps<TooltipProviderProps>(), {
  delayDuration: 300,
})
const forwarded = useForwardProps(props)
</script>

<template>
  <TooltipProvider v-bind="forwarded">
    <slot />
  </TooltipProvider>
</template>
