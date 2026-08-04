<script setup lang="ts">
import { ref } from 'vue'
import { useJsonStore } from '@/stores/json'
import { Plus, X } from 'lucide-vue-next'

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
  <div class="flex h-full w-32 shrink-0 flex-col border-r bg-muted/30 p-2">
    <div class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
      <div
        v-for="tab in store.tabs"
        :key="tab.id"
        class="group flex h-8 min-w-0 shrink-0 cursor-default items-center gap-1 rounded-md border px-2 text-xs transition-colors select-none"
        :class="
          store.activeId === tab.id
            ? 'border-border bg-background text-foreground shadow-xs'
            : 'border-transparent bg-transparent text-muted-foreground hover:bg-background/60 hover:text-foreground'
        "
        @click="store.setActive(tab.id)"
      >
        <template v-if="editingId === tab.id">
          <input
            v-model="editingName"
            class="min-w-0 flex-1 rounded border bg-background px-1 py-0.5 text-xs outline-none focus:border-ring"
            @click.stop
            @keyup.enter="commitRename"
            @keyup.esc="editingId = null"
            @blur="commitRename"
          />
        </template>
        <template v-else>
          <span
            class="min-w-0 flex-1 cursor-default truncate"
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

      <button
        type="button"
        class="flex h-8 w-full shrink-0 items-center justify-center rounded-md bg-accent text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        title="新建空白 Tab"
        aria-label="新建空白 Tab"
        @click="store.addTab"
      >
        <Plus class="size-4" />
      </button>
    </div>
  </div>
</template>
