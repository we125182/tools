<script setup lang="ts">
import { computed } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useJsonStore } from '@/stores/json'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import TabBar from './TabBar.vue'
import { Wand2, Minimize2, Play, Trash2 } from 'lucide-vue-next'

const store = useJsonStore()

const charCount = computed(() => store.activeInput.length)

// 防抖实时校验（不回写、不覆盖输入，仅更新右侧预览与错误）
const reparseDebounced = useDebounceFn(() => store.reparse(), 300)

function onInput() {
  reparseDebounced()
}
</script>

<template>
  <div class="flex h-full min-h-0">
    <TabBar />

    <div class="flex min-w-0 flex-1 flex-col">
      <div class="flex items-center gap-2 border-b px-3 py-2">
        <Button size="sm" @click="store.format">
          <Wand2 class="size-4" /> 格式化
        </Button>
        <Button type="button" size="sm" variant="outline" @click="store.compress">
          <Minimize2 class="size-4" /> 压缩
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
    </div>
  </div>
</template>
