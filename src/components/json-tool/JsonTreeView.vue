<script setup lang="ts">
import { computed } from 'vue'
import { useJsonStore } from '@/stores/json'
import JsonNode from './JsonNode.vue'

const store = useJsonStore()

const hasData = computed(() => store.parsed !== null && store.parsed !== undefined)
</script>

<template>
  <div class="font-mono">
    <JsonNode
      v-if="hasData"
      :value="store.parsed"
      :segments="[]"
      :depth="0"
      :is-last="true"
    />
    <div
      v-else
      class="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center text-muted-foreground"
    >
      <p class="text-sm">输入 JSON 并点击「格式化」后，结果将在此展示。</p>
    </div>
  </div>
</template>
