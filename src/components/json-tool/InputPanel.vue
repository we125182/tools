<script setup lang="ts">
import { computed } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useJsonStore } from '@/stores/json'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import TabBar from './TabBar.vue'
import { Wand2, Play, Trash2, AlertCircle, CheckCircle2 } from 'lucide-vue-next'

const store = useJsonStore()

const status = computed<'idle' | 'valid' | 'error'>(() => {
  if (!store.hasParsed) return 'idle'
  return store.errors.length > 0 ? 'error' : 'valid'
})

const firstError = computed(() => store.errors[0])

const charCount = computed(() => store.activeInput.length)

// 防抖实时校验（不回写、不覆盖输入，仅更新右侧预览与错误）
const reparseDebounced = useDebounceFn(() => store.reparse(), 300)

function onInput() {
  reparseDebounced()
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <TabBar />

    <div class="flex items-center gap-2 border-b px-3 py-2">
      <Button size="sm" @click="store.format">
        <Wand2 class="size-4" /> 格式化
      </Button>
      <Button size="sm" variant="outline" @click="store.reparse">
        <Play class="size-4" /> 校验
      </Button>
      <Button
        size="sm"
        variant="ghost"
        class="text-muted-foreground"
        @click="store.clearInput"
      >
        <Trash2 class="size-4" /> 清空
      </Button>
      <span class="ml-auto font-mono text-[11px] text-muted-foreground">
        {{ charCount }} 字符
      </span>
    </div>

    <div class="relative min-h-0 flex-1">
      <Textarea
        :model-value="store.activeInput"
        @update:model-value="
          (v: string | undefined) => {
            store.activeInput = v ?? ''
            onInput()
          }
        "
        placeholder='{ "hello": "world", "items": [1, 2, 3] }'
        spellcheck="false"
        class="h-full min-h-full w-full resize-none rounded-none border-0 font-mono text-[13px] leading-5 shadow-none focus-visible:ring-0"
      />
    </div>

    <!-- 状态条 -->
    <div
      v-if="status !== 'idle'"
      class="flex items-center gap-2 border-t px-3 py-1.5 text-xs"
      :class="
        status === 'valid'
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : 'bg-destructive/10 text-destructive'
      "
    >
      <CheckCircle2 v-if="status === 'valid'" class="size-4 shrink-0" />
      <AlertCircle v-else class="size-4 shrink-0" />
      <template v-if="status === 'valid'">
        <span>✓ 合法的 JSON</span>
        <Badge variant="secondary" class="ml-auto">{{ store.nodeCount }} 节点</Badge>
      </template>
      <template v-else-if="firstError">
        <span class="font-mono">
          第 {{ firstError.line }} 行 第 {{ firstError.column }} 列：{{ firstError.message }}
        </span>
        <Badge v-if="store.errors.length > 1" variant="destructive" class="ml-auto">
          +{{ store.errors.length - 1 }}
        </Badge>
      </template>
    </div>
  </div>
</template>
