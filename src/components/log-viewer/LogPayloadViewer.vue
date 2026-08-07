<script setup lang="ts">
import { reactive, watch } from 'vue'
import JsonTreeView from '@/components/json-tool/JsonTreeView.vue'
import type { JsonTreeController } from '@/components/json-tool/tree-controller'
import { pathKey, type PathSegment } from '@/lib/jsonc'

const props = defineProps<{
  value: unknown
}>()

const expandMap = reactive<Map<string, boolean>>(new Map())
const emptyMatches = new Set<string>()

const controller: JsonTreeController = {
  indentSize: '2',
  sortMode: 'asc',
  query: '',
  matchedPathKeys: emptyMatches,
  currentMatchKey: () => null,
  isExpanded(segments: PathSegment[]) {
    return expandMap.get(pathKey(segments)) ?? true
  },
  setExpanded(segments: PathSegment[], expanded: boolean) {
    expandMap.set(pathKey(segments), expanded)
  },
  toggleExpanded(segments: PathSegment[]) {
    const key = pathKey(segments)
    expandMap.set(key, !(expandMap.get(key) ?? true))
  },
}

watch(
  () => props.value,
  () => expandMap.clear(),
)
</script>

<template>
  <div class="min-h-0 flex-1">
    <div class="h-full overflow-auto p-3">
      <JsonTreeView :value="value" :controller="controller" :use-store-value="false" />
    </div>
  </div>
</template>
