<script setup lang="ts">
import { ref } from 'vue'
import { Braces, PanelLeftClose, PanelLeftOpen, ScrollText } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

defineProps<{
  activeFeature: 'json-tools' | 'log-viewer'
}>()

const emit = defineEmits<{
  'update:activeFeature': [feature: 'json-tools' | 'log-viewer']
}>()

const isCollapsed = ref(true)
</script>

<template>
  <aside
    aria-label="功能列表"
    class="flex h-full shrink-0 flex-col border-r bg-muted/30 p-2 transition-[width] duration-200 ease-out"
    :class="isCollapsed ? 'w-14' : 'w-52'"
  >
    <div class="flex h-8 shrink-0 items-center px-2">
      <span v-if="!isCollapsed" class="text-xs font-medium text-muted-foreground">工具</span>

      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="ml-auto flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            :aria-label="isCollapsed ? '展开功能导航' : '收起功能导航'"
            @click="isCollapsed = !isCollapsed"
          >
            <PanelLeftOpen v-if="isCollapsed" class="size-4" />
            <PanelLeftClose v-else class="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {{ isCollapsed ? '展开功能导航' : '收起功能导航' }}
        </TooltipContent>
      </Tooltip>
    </div>

    <nav class="flex flex-col gap-1" aria-label="工具">
      <div class="group relative">
        <button
          type="button"
          class="flex h-10 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors"
          :class="[
            isCollapsed && 'justify-center px-0',
            activeFeature === 'json-tools'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          ]"
          :aria-current="activeFeature === 'json-tools' ? 'page' : undefined"
          aria-label="JSON Tools"
          title="JSON Tools"
          @click="emit('update:activeFeature', 'json-tools')"
        >
          <Braces class="size-4 shrink-0" />
          <span v-if="!isCollapsed" class="min-w-0 truncate">JSON Tools</span>
        </button>
        <span
          v-if="isCollapsed"
          data-feature-tooltip
          role="tooltip"
          class="pointer-events-none absolute top-1/2 left-full z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        >
          JSON Tools
        </span>
      </div>

      <div class="group relative">
        <button
          type="button"
          class="flex h-10 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors"
          :class="[
            isCollapsed && 'justify-center px-0',
            activeFeature === 'log-viewer'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          ]"
          :aria-current="activeFeature === 'log-viewer' ? 'page' : undefined"
          aria-label="Log Viewer"
          title="Log Viewer"
          @click="emit('update:activeFeature', 'log-viewer')"
        >
          <ScrollText class="size-4 shrink-0" />
          <span v-if="!isCollapsed" class="min-w-0 truncate">Log Viewer</span>
        </button>
        <span
          v-if="isCollapsed"
          data-feature-tooltip="log-viewer"
          role="tooltip"
          class="pointer-events-none absolute top-1/2 left-full z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        >
          Log Viewer
        </span>
      </div>
    </nav>
  </aside>
</template>
