<script setup lang="ts">
import { computed } from 'vue'
import {
  ArrowDownAZ,
  ArrowDownUp,
  ArrowDownZA,
  Check,
  ChevronsDownUp,
  ChevronsUpDown,
  ChevronDown,
  ChevronUp,
  Search,
  X,
} from 'lucide-vue-next'
import { useJsonStore } from '@/stores/json'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const store = useJsonStore()

const sortLabel = computed(() => {
  if (store.sortMode === 'asc') return '键名排序：升序'
  if (store.sortMode === 'desc') return '键名排序：倒序'
  return '键名排序：默认'
})

function toggleAll() {
  if (store.hasExpandedNodes) store.collapseAll()
  else store.expandAll()
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 p-2">
    <Button
      variant="outline"
      size="sm"
      :aria-label="store.hasExpandedNodes ? '收起全部' : '展开全部'"
      :disabled="!store.parsed"
      @click="toggleAll"
    >
      <ChevronsDownUp v-if="store.hasExpandedNodes" class="size-4" />
      <ChevronsUpDown v-else class="size-4" />
      {{ store.hasExpandedNodes ? '收起全部' : '展开全部' }}
    </Button>

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="outline"
          size="icon"
          class="size-8"
          :aria-label="sortLabel"
          :disabled="!store.parsed"
        >
          <ArrowDownAZ v-if="store.sortMode === 'asc'" class="size-4" />
          <ArrowDownZA v-else-if="store.sortMode === 'desc'" class="size-4" />
          <ArrowDownUp v-else class="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>键名排序</DropdownMenuLabel>
        <DropdownMenuItem @select="store.sortMode = 'default'">
          <ArrowDownUp class="size-4" />
          默认
          <Check
            class="ml-auto size-4"
            :class="store.sortMode === 'default' ? 'opacity-100' : 'opacity-0'"
          />
        </DropdownMenuItem>
        <DropdownMenuItem @select="store.sortMode = 'asc'">
          <ArrowDownAZ class="size-4" />
          升序
          <Check
            class="ml-auto size-4"
            :class="store.sortMode === 'asc' ? 'opacity-100' : 'opacity-0'"
          />
        </DropdownMenuItem>
        <DropdownMenuItem @select="store.sortMode = 'desc'">
          <ArrowDownZA class="size-4" />
          倒序
          <Check
            class="ml-auto size-4"
            :class="store.sortMode === 'desc' ? 'opacity-100' : 'opacity-0'"
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Separator orientation="vertical" class="h-6" />

    <!-- 搜索 -->
    <div class="flex min-w-0 flex-1 items-center gap-1.5">
      <div class="relative min-w-0 flex-1">
        <Search class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="store.query"
          placeholder="搜索文本…"
          class="h-8 pl-8 pr-16"
          :disabled="!store.parsed"
        />
        <button
          v-if="store.query"
          class="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
          @click="store.clearSearch"
        >
          <X class="size-3.5" />
        </button>
      </div>
    </div>

    <!-- 计数与导航 -->
    <div v-if="store.query" class="flex items-center gap-1">
      <Badge variant="secondary" class="h-8 gap-1 px-2 font-mono">
        <template v-if="store.matchCount > 0">
          {{ store.matchIndex + 1 }}/{{ store.matchCount }}
        </template>
        <template v-else>无匹配</template>
      </Badge>
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="size-8"
            :disabled="store.matchCount === 0"
            @click="store.prevMatch"
          >
            <ChevronUp class="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>上一个</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="size-8"
            :disabled="store.matchCount === 0"
            @click="store.nextMatch"
          >
            <ChevronDown class="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>下一个</TooltipContent>
      </Tooltip>
    </div>

  </div>
</template>
