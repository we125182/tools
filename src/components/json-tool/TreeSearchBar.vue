<script setup lang="ts">
import { ChevronsDownUp, ChevronsUpDown, Search, X, ChevronUp, ChevronDown } from 'lucide-vue-next'
import type { AcceptableValue } from 'reka-ui'
import { useJsonStore } from '@/stores/json'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

const store = useJsonStore()

function onModeChange(val: AcceptableValue | AcceptableValue[]) {
  if (val === 'value' || val === 'path') store.searchMode = val
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 p-2">
    <div class="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        :disabled="!store.parsed"
        @click="store.expandAll"
      >
        <ChevronsUpDown class="size-4" /> 展开全部
      </Button>
      <Button
        variant="outline"
        size="sm"
        :disabled="!store.parsed"
        @click="store.collapseAll"
      >
        <ChevronsDownUp class="size-4" /> 收起全部
      </Button>
    </div>

    <Separator orientation="vertical" class="h-6" />

    <!-- 搜索 -->
    <div class="flex min-w-0 flex-1 items-center gap-1.5">
      <div class="relative min-w-0 flex-1">
        <Search class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="store.query"
          placeholder="搜索值或键…"
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

      <ToggleGroup
        type="single"
        :model-value="store.searchMode"
        @update:model-value="onModeChange"
      >
        <ToggleGroupItem value="value" class="h-8 px-2 text-xs">值</ToggleGroupItem>
        <ToggleGroupItem value="path" class="h-8 px-2 text-xs">键路径</ToggleGroupItem>
      </ToggleGroup>
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
