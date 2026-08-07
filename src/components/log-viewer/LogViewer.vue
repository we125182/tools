<script setup lang="ts">
import { computed, ref } from 'vue'
import { Clock3, Link, Upload } from 'lucide-vue-next'
import LogPayloadViewer from './LogPayloadViewer.vue'
import LogTabBar from './LogTabBar.vue'
import { toast } from '@/components/ui/sonner'
import { useLogViewerStore } from '@/stores/log-viewer'

const store = useLogViewerStore()
const isDraggingFiles = ref(false)

const requestValue = computed(() => {
  const log = store.activeLog
  return log?.req ?? null
})

const responseValue = computed(() => {
  const log = store.activeLog
  return log?.res ?? null
})

const durationText = computed(() => {
  const duration = store.activeLog?.duration
  return duration === undefined || duration === '' ? '耗时未知' : String(duration)
})

const requestTimeText = computed(() => {
  const reqTime = store.activeLog?.reqTime
  return reqTime === undefined || reqTime === '' ? null : String(reqTime)
})

function containsFiles(event: DragEvent) {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files')
}

function onDragEnter(event: DragEvent) {
  if (containsFiles(event)) isDraggingFiles.value = true
}

function onDragLeave(event: DragEvent) {
  if (event.currentTarget === event.target) isDraggingFiles.value = false
}

async function importFiles(files: File[]) {
  let importedCount = 0
  const failures: string[] = []

  for (const file of files) {
    try {
      store.addLogGroup(file.name, JSON.parse(await file.text()) as unknown)
      importedCount++
    } catch (error) {
      const detail = error instanceof Error ? error.message : '文件内容无效'
      failures.push(`${file.name}：${detail}`)
    }
  }

  if (importedCount) {
    const successToastOptions = {
      title: '日志已导入',
      description: `已导入 ${importedCount} 个文件，共 ${store.logs.length} 条请求`,
      position: 'top-right' as const,
    }
    toast.success('日志已导入', successToastOptions)
  }
  if (failures.length) {
    toast.error('部分日志未导入', {
      description: failures.join('；'),
      position: 'top-right',
    })
  }
}

function onDrop(event: DragEvent) {
  isDraggingFiles.value = false
  void importFiles(Array.from(event.dataTransfer?.files ?? []))
}
</script>

<template>
  <div
    class="relative flex h-full min-h-0"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <LogTabBar @import="importFiles" />

    <section class="flex min-w-0 flex-1 flex-col">
      <template v-if="store.activeLog">
        <header class="flex min-h-14 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-2">
          <div class="flex min-w-0 flex-1 items-center gap-2">
            <Link class="size-4 shrink-0 text-muted-foreground" />
            <span class="truncate font-mono text-sm" :title="store.activeLog.url">
              {{ store.activeLog.url }}
            </span>
          </div>

          <span class="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Clock3 class="size-3.5" /> 请求耗时 {{ durationText }}
          </span>
          <span
            v-if="requestTimeText"
            class="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Clock3 class="size-3.5" /> 请求时间 {{ requestTimeText }}
          </span>
        </header>

        <div class="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
          <section data-log-payload="request" class="flex min-h-0 flex-col border-b lg:border-r lg:border-b-0">
            <div class="shrink-0 border-b px-3 py-2 text-xs font-medium">请求参数</div>
            <LogPayloadViewer :value="requestValue" />
          </section>
          <section data-log-payload="response" class="flex min-h-0 flex-col">
            <div class="shrink-0 border-b px-3 py-2 text-xs font-medium">响应参数</div>
            <LogPayloadViewer :value="responseValue" />
          </section>
        </div>
      </template>

      <div v-else class="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
        导入日志文件后查看请求详情
      </div>
    </section>

    <div
      v-if="isDraggingFiles"
      class="absolute inset-0 z-20 flex items-center justify-center border-2 border-primary border-dashed bg-background/90"
    >
      <div class="flex items-center gap-2 text-sm font-medium">
        <Upload class="size-5" /> 释放以导入日志文件
      </div>
    </div>
  </div>
</template>
