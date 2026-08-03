<script setup lang="ts">
import { ref } from 'vue'
import { useJsonStore } from '@/stores/json'
import { Plus, Copy, X } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const store = useJsonStore()

const editingId = ref<string | null>(null)
const editingName = ref('')

function startRename(id: string, current: string) {
  editingId.value = id
  editingName.value = current
}
function commitRename() {
  if (editingId.value) {
    store.renameTab(editingId.value, editingName.value.trim() || 'Untitled')
  }
  editingId.value = null
}
</script>

<template>
  <div class="flex items-end gap-1 border-b bg-muted/30 px-2 pt-2">
    <div class="flex flex-1 items-end gap-1 overflow-x-auto">
      <div
        v-for="tab in store.tabs"
        :key="tab.id"
        class="group flex h-8 shrink-0 items-center gap-1 rounded-t-md border border-b-0 px-2.5 text-xs transition-colors"
        :class="
          store.activeId === tab.id
            ? 'bg-background text-foreground'
            : 'border-transparent bg-transparent text-muted-foreground hover:bg-background/60 hover:text-foreground'
        "
        @click="store.setActive(tab.id)"
      >
        <template v-if="editingId === tab.id">
          <input
            v-model="editingName"
            class="w-24 rounded border bg-background px-1 py-0.5 text-xs outline-none focus:border-ring"
            @click.stop
            @keyup.enter="commitRename"
            @keyup.esc="editingId = null"
            @blur="commitRename"
          />
        </template>
        <template v-else>
          <span
            class="max-w-[8rem] truncate"
            @dblclick.stop="startRename(tab.id, tab.name)"
          >
            {{ tab.name }}
          </span>
          <button
            class="rounded p-0.5 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
            :class="{ '!opacity-60': store.activeId === tab.id }"
            title="关闭"
            @click.stop="store.closeTab(tab.id)"
          >
            <X class="size-3" />
          </button>
        </template>
      </div>

      <!-- 新建 / 复制 -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button
            class="mb-0.5 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="新建 / 复制 Tab"
          >
            <Plus class="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem @select="store.addTab">
            <Plus class="size-4" /> 新建空白 Tab
          </DropdownMenuItem>
          <DropdownMenuItem @select="store.duplicateTab(store.activeId)">
            <Copy class="size-4" /> 复制当前 Tab
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <span class="mb-1 px-1 text-[10px] text-muted-foreground">
      双击标签可重命名
    </span>
  </div>
</template>
