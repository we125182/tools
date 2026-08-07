<script setup lang="ts">
import { computed } from 'vue'
import { useJsonStore } from '@/stores/json'
import JsonNode from './JsonNode.vue'
import type { JsonTreeController } from './tree-controller'

const store = useJsonStore()
const props = defineProps<{
  value?: unknown
  controller?: JsonTreeController
  useStoreValue?: boolean
}>()

const displayedValue = computed(() =>
  props.useStoreValue === false ? props.value : store.parsed,
)
const hasData = computed(
  () => displayedValue.value !== null && displayedValue.value !== undefined,
)
</script>

<template>
  <div class="font-mono">
    <JsonNode
      v-if="hasData"
      :value="displayedValue"
      :segments="[]"
      :depth="0"
      :is-last="true"
      :controller="controller"
    />
    <div
      v-else
      class="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center text-muted-foreground"
    >
      <p class="text-sm">输入 JSON 并点击「格式化」后，结果将在此展示。</p>
    </div>
  </div>
</template>
