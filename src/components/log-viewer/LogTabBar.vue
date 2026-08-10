<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown, ChevronRight, FileJson, FileUp, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useLogViewerStore } from '@/stores/log-viewer'

const store = useLogViewerStore()
const fileInput = ref<HTMLInputElement | null>(null)
const collapsedGroupIds = ref<Set<string>>(new Set())

const emit = defineEmits<{
  import: [files: File[]]
}>()

function chooseFile() {
  fileInput.value?.click()
}

function selectLogFiles(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (files.length) emit('import', files)
}

function isGroupExpanded(id: string) {
  return !collapsedGroupIds.value.has(id)
}

function toggleGroup(id: string) {
  const next = new Set(collapsedGroupIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  collapsedGroupIds.value = next
}
</script>

<template>
  <aside class="flex h-full w-28 shrink-0 flex-col border-r bg-muted/30 p-2 sm:w-44">
    <div class="mb-2 flex h-8 items-center px-2">
      <span class="text-xs font-medium text-muted-foreground">请求日志</span>
      <span class="ml-auto font-mono text-[11px] text-muted-foreground">{{ store.logs.length }}</span>
    </div>

    <div class="min-h-0 flex-1 space-y-3 overflow-y-auto">
      <section v-for="group in store.groups" :key="group.id" :aria-label="group.name">
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              type="button"
              class="flex h-7 w-full min-w-0 items-center gap-1.5 rounded-sm px-2 text-left text-[11px] text-muted-foreground hover:bg-background/60 hover:text-foreground"
              :aria-expanded="isGroupExpanded(group.id)"
              :aria-label="`${isGroupExpanded(group.id) ? '收起' : '展开'} ${group.name}`"
              :title="group.name"
              @click="toggleGroup(group.id)"
            >
              <component :is="isGroupExpanded(group.id) ? ChevronDown : ChevronRight" class="size-3 shrink-0" />
              <FileJson class="size-3.5 shrink-0" />
              <span class="min-w-0 flex-1 truncate">{{ group.name }}</span>
              <span class="font-mono">{{ group.logs.length }}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" class="max-w-64 break-all">
            {{ group.name }}
          </TooltipContent>
        </Tooltip>

        <div v-show="isGroupExpanded(group.id)" class="space-y-1">
          <button
            v-for="log in group.logs"
            :key="log.id"
            type="button"
            class="flex h-9 w-full items-center rounded-md px-2 text-left text-xs transition-colors"
            :class="
              store.activeId === log.id
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
            "
            :aria-current="store.activeId === log.id ? 'page' : undefined"
            :title="log.url"
            @click="store.setActive(log.id)"
          >
            <span class="truncate">{{ log.name }}</span>
          </button>
        </div>
      </section>

      <p v-if="store.logs.length === 0" class="px-2 py-4 text-xs leading-5 text-muted-foreground">
        暂无日志
      </p>
    </div>

    <div class="mt-2 flex items-center gap-1 border-t pt-2">
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="size-8"
            aria-label="导入日志文件"
            @click="chooseFile"
          >
            <FileUp class="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>导入日志文件</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="size-8"
            aria-label="清空日志"
            :disabled="store.logs.length === 0"
            @click="store.clearLogs"
          >
            <Trash2 class="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>清空日志</TooltipContent>
      </Tooltip>
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json,.log.json"
        multiple
        class="hidden"
        @change="selectLogFiles"
      />
    </div>
  </aside>
</template>
