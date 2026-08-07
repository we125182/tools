<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Toaster as Sonner } from 'vue-sonner'
import 'vue-sonner/style.css'

const isDark = ref(
  document.documentElement.classList.contains('dark'),
)

// 监听 html class 变化以同步深色模式
const observer = new MutationObserver(() => {
  isDark.value = document.documentElement.classList.contains('dark')
})
onMounted(() => {
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
})
onUnmounted(() => observer.disconnect())
</script>

<template>
  <Sonner
    class="toaster group"
    position="bottom-right"
    :theme="isDark ? 'dark' : 'light'"
    :style="{
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
    } as Record<string, string>"
  />
</template>
