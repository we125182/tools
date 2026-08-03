<script setup lang="ts">
import { useJsonStore } from '@/stores/json'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import TreeSearchBar from './TreeSearchBar.vue'
import JsonTreeView from './JsonTreeView.vue'
import { AlertTriangle } from 'lucide-vue-next'

const store = useJsonStore()
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <TreeSearchBar />

    <!-- 大数据提示 -->
    <div
      v-if="store.isLargeData"
      class="flex items-center gap-2 border-y bg-amber-500/10 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-400"
    >
      <AlertTriangle class="size-4 shrink-0" />
      <span>数据较大（{{ store.nodeCount }} 节点），已默认折叠以保持流畅。</span>
    </div>

    <ScrollArea class="min-h-0 flex-1">
      <div class="p-3">
        <JsonTreeView />
      </div>
    </ScrollArea>

    <div
      v-if="store.hasParsed && !store.errors.length"
      class="flex items-center gap-2 border-t px-3 py-1 text-[11px] text-muted-foreground"
    >
      <span>右键节点可复制 路径 / 值 / 对象</span>
      <Badge variant="outline" class="ml-auto">{{ store.nodeCount }} 节点</Badge>
    </div>
  </div>
</template>
