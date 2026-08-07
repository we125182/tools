<script setup lang="ts">
import { onMounted, ref } from 'vue'
import FeatureSidebar from '@/components/FeatureSidebar.vue'
import AppHeader from '@/components/json-tool/AppHeader.vue'
import InputPanel from '@/components/json-tool/InputPanel.vue'
import OutputPanel from '@/components/json-tool/OutputPanel.vue'
import LogViewer from '@/components/log-viewer/LogViewer.vue'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useJsonStore } from '@/stores/json'

const store = useJsonStore()
const activeFeature = ref<'json-tools' | 'log-viewer'>('json-tools')

// 启动时对已有输入做一次解析，恢复右侧树
onMounted(() => {
  if (store.activeInput.trim()) store.reparse()
})
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <div class="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <FeatureSidebar v-model:active-feature="activeFeature" />

      <div class="flex min-w-0 flex-1 flex-col">
        <AppHeader :active-feature="activeFeature" />

        <main v-if="activeFeature === 'json-tools'" class="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
          <!-- 左：输入 -->
          <section class="flex min-h-0 min-w-0 flex-col border-r">
            <InputPanel />
          </section>

          <!-- 右：输出树 -->
          <section class="hidden min-h-0 min-w-0 flex-col lg:flex">
            <OutputPanel />
          </section>
        </main>

        <main v-else class="min-h-0 flex-1">
          <LogViewer />
        </main>
      </div>

      <Toaster />
    </div>
  </TooltipProvider>
</template>
