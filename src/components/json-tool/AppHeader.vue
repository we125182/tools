<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useStorage, useClipboard } from '@vueuse/core'
import type { AcceptableValue } from 'reka-ui'
import { useJsonStore } from '@/stores/json'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import { toast } from '@/components/ui/sonner'
import { beautify } from '@/lib/jsonc'
import {
  Braces,
  Moon,
  Sun,
  Copy,
  IndentIncrease,
} from 'lucide-vue-next'

const store = useJsonStore()

// ---------- 深色模式 ----------
const isDark = useStorage('jt:theme', () => {
  if (typeof window === 'undefined') return false
  return document.documentElement.classList.contains('dark')
})
function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
}
// 初始化同步
onMounted(() => applyTheme(isDark.value))
watch(isDark, (v) => applyTheme(v))

function toggleTheme() {
  isDark.value = !isDark.value
}

// ---------- 复制全部 ----------
const { copy } = useClipboard({ legacy: true })
async function copyAll() {
  if (!store.parsed) {
    toast({ title: '没有可复制的 JSON', description: '请先格式化' })
    return
  }
  const text = beautify(store.parsed, Number(store.indentSize))
  await copy(text)
  toast({ title: '已复制全部 JSON', description: `${text.length} 字符` })
}

// ---------- 缩进切换 ----------
function onIndent(val: AcceptableValue | AcceptableValue[]) {
  if (val === '2' || val === '4') store.indentSize = val
}
</script>

<template>
  <header
    class="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4"
  >
    <div class="flex items-center gap-2">
      <div class="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Braces class="size-4" />
      </div>
      <div class="leading-tight">
        <h1 class="text-sm font-semibold">JSON Tools</h1>
        <p class="text-[11px] text-muted-foreground">校验 · 格式化 · 浏览</p>
      </div>
    </div>

    <div class="ml-auto flex items-center gap-3">
      <!-- 缩进 -->
      <div class="flex items-center gap-1.5">
        <IndentIncrease class="size-4 text-muted-foreground" />
        <ToggleGroup
          type="single"
          :model-value="store.indentSize"
          @update:model-value="onIndent"
        >
          <ToggleGroupItem value="2" class="h-7 px-2 text-xs">2</ToggleGroupItem>
          <ToggleGroupItem value="4" class="h-7 px-2 text-xs">4</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button variant="outline" size="sm" @click="copyAll">
            <Copy class="size-4" /> 复制全部
          </Button>
        </TooltipTrigger>
        <TooltipContent>复制格式化后的完整 JSON</TooltipContent>
      </Tooltip>

      <!-- 深色模式开关 -->
      <div class="flex items-center gap-1.5">
        <Sun class="size-4 text-muted-foreground" />
        <Switch :model-value="isDark" @update:model-value="toggleTheme" />
        <Moon class="size-4 text-muted-foreground" />
      </div>
    </div>
  </header>
</template>
