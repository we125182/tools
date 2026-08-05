<script setup lang="ts">
import { Braces } from 'lucide-vue-next'

defineProps<{
  activeFeature: 'json-tools'
}>()

const emit = defineEmits<{
  'update:activeFeature': [feature: 'json-tools']
}>()
</script>

<template>
  <aside
    aria-label="功能列表"
    class="flex h-full w-52 shrink-0 flex-col border-r bg-muted/30 p-2 max-md:w-14"
  >
    <div class="px-2 py-2 text-xs font-medium text-muted-foreground max-md:sr-only">工具</div>

    <nav class="flex flex-col gap-1" aria-label="工具">
      <button
        type="button"
        class="flex h-10 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors max-md:justify-center max-md:px-0"
        :class="
          activeFeature === 'json-tools'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        "
        :aria-current="activeFeature === 'json-tools' ? 'page' : undefined"
        aria-label="JSON Tools"
        @click="emit('update:activeFeature', 'json-tools')"
      >
        <Braces class="size-4 shrink-0" />
        <span class="min-w-0 truncate max-md:sr-only">JSON Tools</span>
      </button>
    </nav>
  </aside>
</template>
