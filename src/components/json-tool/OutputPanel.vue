<script setup lang="ts">
import { computed } from 'vue'
import { useJsonStore } from '@/stores/json'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type { JsonError } from '@/lib/jsonc'
import TreeSearchBar from './TreeSearchBar.vue'
import JsonTreeView from './JsonTreeView.vue'
import { AlertCircle, AlertTriangle } from 'lucide-vue-next'

const store = useJsonStore()

const SNIPPET_CONTEXT = 32

interface ErrorSnippet {
  prefix: string
  highlight: string
  suffix: string
}

function getErrorSnippet(error: JsonError): ErrorSnippet {
  const text = store.activeInput
  const lineStart = text.lastIndexOf('\n', Math.max(0, error.offset - 1)) + 1
  const nextLine = text.indexOf('\n', error.offset)
  const lineEnd = nextLine === -1 ? text.length : nextLine
  const line = text.slice(lineStart, lineEnd).replace(/\r$/, '')
  const errorIndex = Math.min(Math.max(error.offset - lineStart, 0), line.length)
  const start = Math.max(0, errorIndex - SNIPPET_CONTEXT)
  const end = Math.min(line.length, errorIndex + SNIPPET_CONTEXT + 1)

  return {
    prefix: `${start > 0 ? '...' : ''}${line.slice(start, errorIndex)}`,
    highlight: line.slice(errorIndex, errorIndex + 1),
    suffix: `${line.slice(errorIndex + 1, end)}${end < line.length ? '...' : ''}`,
  }
}

const errorItems = computed(() =>
  store.errors.map((error) => ({ error, snippet: getErrorSnippet(error) })),
)
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <template v-if="store.errors.length">
      <div class="flex min-h-0 flex-1 flex-col" aria-live="polite">
        <div class="flex items-start gap-3 border-b bg-destructive/10 px-4 py-3 text-destructive">
          <AlertCircle class="mt-0.5 size-4 shrink-0" />
          <div class="min-w-0">
            <h2 class="text-sm font-medium">JSON 校验失败</h2>
            <p class="mt-0.5 text-xs text-muted-foreground">
              发现 {{ store.errors.length }} 个错误，请在左侧修正后重新校验。
            </p>
          </div>
        </div>

        <ScrollArea class="min-h-0 flex-1">
          <ol class="divide-y">
            <li
              v-for="{ error, snippet } in errorItems"
              :key="`${error.offset}-${error.message}`"
              class="flex items-start gap-3 px-4 py-3"
            >
              <Badge variant="destructive" class="shrink-0 font-mono">
                {{ error.line }}:{{ error.column }}
              </Badge>
              <div class="min-w-0 flex-1">
                <pre class="overflow-hidden rounded-sm bg-muted px-2 py-1 font-mono text-xs leading-5 text-foreground whitespace-pre-wrap break-all"><code>{{ snippet.prefix }}<mark
                  v-if="snippet.highlight"
                  class="rounded-sm bg-destructive px-px font-semibold text-destructive-foreground"
                >{{ snippet.highlight }}</mark><span
                  v-else
                  class="inline-block h-4 w-0.5 bg-destructive align-text-bottom"
                />{{ snippet.suffix }}</code></pre>
                <p class="mt-1 text-xs text-muted-foreground">{{ error.message }}</p>
              </div>
            </li>
          </ol>
        </ScrollArea>
      </div>
    </template>

    <template v-else>
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
        v-if="store.hasParsed"
        class="flex items-center gap-2 border-t px-3 py-1 text-[11px] text-muted-foreground"
      >
        <span>右键节点可复制 路径 / 值 / 对象</span>
        <Badge variant="outline" class="ml-auto">{{ store.nodeCount }} 节点</Badge>
      </div>
    </template>
  </div>
</template>
