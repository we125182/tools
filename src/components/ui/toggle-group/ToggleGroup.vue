<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import {
  ToggleGroupRoot,
  type ToggleGroupRootEmits,
  type ToggleGroupRootProps,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<ToggleGroupRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<ToggleGroupRootEmits>()
const delegatedProps = computed(() => {
  const { class: _omit, ...delegated } = props
  return delegated
})
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <ToggleGroupRoot
    v-bind="forwarded"
    data-slot="toggle-group"
    :class="
      cn(
        'group/toggle-group flex w-fit items-center rounded-md data-[orientation=vertical]:flex-col',
        props.class,
      )
    "
  >
    <slot />
  </ToggleGroupRoot>
</template>
