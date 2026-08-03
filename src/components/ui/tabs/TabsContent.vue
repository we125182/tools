<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import {
  TabsContent,
  type TabsContentProps,
  useForwardProps,
} from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<TabsContentProps & { class?: HTMLAttributes['class'] }>()
const forwarded = useForwardProps(
  computed(() => {
    const { class: _omit, ...delegated } = props
    return delegated
  }),
)
</script>

<template>
  <TabsContent
    v-bind="forwarded"
    data-slot="tabs-content"
    :class="cn('flex-1 outline-none', props.class)"
  >
    <slot />
  </TabsContent>
</template>
