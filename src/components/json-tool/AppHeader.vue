<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { Switch } from '@/components/ui/switch'
import {
  Braces,
  Moon,
  Sun,
} from 'lucide-vue-next'

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

    <div class="ml-auto">
      <Switch
        aria-label="切换深色模式"
        :model-value="isDark"
        @update:model-value="isDark = $event"
      >
        <template #thumb>
          <Moon v-if="isDark" class="size-2.5 text-muted-foreground" />
          <Sun v-else class="size-2.5 text-muted-foreground" />
        </template>
      </Switch>
    </div>
  </header>
</template>
