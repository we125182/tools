<script setup lang="ts">
import { computed, useTemplateRef, watch, nextTick } from 'vue'
import { useClipboard } from '@vueuse/core'
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
  FileJson,
  Braces,
} from 'lucide-vue-next'
import { useJsonStore } from '@/stores/json'
import { toast } from '@/components/ui/sonner'
import {
  beautify,
  pathKey,
  summary,
  typeOf,
  type PathSegment,
} from '@/lib/jsonc'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

const props = defineProps<{
  value: unknown
  keyName?: string | number
  segments: PathSegment[]
  depth: number
  isLast?: boolean
}>()

const store = useJsonStore()
const { copy } = useClipboard({ legacy: true })

const nodeType = computed(() => typeOf(props.value))
const isContainer = computed(
  () => nodeType.value === 'object' || nodeType.value === 'array',
)
const openBracket = computed(() => (nodeType.value === 'array' ? '[' : '{'))
const closeBracket = computed(() => (nodeType.value === 'array' ? ']' : '}'))

const nodeKey = computed(() => pathKey(props.segments))

const hasChildren = computed(() => {
  if (!isContainer.value) return false
  if (Array.isArray(props.value)) return props.value.length > 0
  if (props.value && typeof props.value === 'object')
    return Object.keys(props.value).length > 0
  return false
})

const expanded = computed(() =>
  isContainer.value && hasChildren.value
    ? store.isExpanded(props.segments, props.depth)
    : false,
)

const isMatch = computed(() => store.matchedPathKeys.has(nodeKey.value))
const isCurrentMatch = computed(
  () => store.currentMatchKey() === nodeKey.value,
)

// 当前命中节点：滚动到视口
const rowRef = useTemplateRef<HTMLElement>('rowRef')
watch(isCurrentMatch, async (cur) => {
  if (cur) {
    await nextTick()
    rowRef.value?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
})

const entries = computed<Array<[string | number, unknown]>>(() => {
  if (Array.isArray(props.value)) {
    return props.value.map((v, i) => [i, v])
  }
  if (props.value && typeof props.value === 'object') {
    return Object.entries(props.value)
  }
  return []
})

function toggle() {
  if (hasChildren.value) store.toggleExpanded(props.segments, props.depth)
}

function displayValue(): string {
  switch (nodeType.value) {
    case 'string':
      return `"${props.value as string}"`
    case 'number':
    case 'boolean':
      return String(props.value)
    case 'null':
      return 'null'
    default:
      return ''
  }
}

interface TextPart {
  text: string
  isMatch: boolean
}

function highlightText(text: string): TextPart[] {
  const query = store.query.trim()
  if (!query) return [{ text, isMatch: false }]

  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const parts: TextPart[] = []
  let start = 0
  let matchIndex = lowerText.indexOf(lowerQuery, start)

  while (matchIndex !== -1) {
    if (matchIndex > start) {
      parts.push({ text: text.slice(start, matchIndex), isMatch: false })
    }
    parts.push({
      text: text.slice(matchIndex, matchIndex + query.length),
      isMatch: true,
    })
    start = matchIndex + query.length
    matchIndex = lowerText.indexOf(lowerQuery, start)
  }

  if (start < text.length) {
    parts.push({ text: text.slice(start), isMatch: false })
  }

  return parts.length > 0 ? parts : [{ text, isMatch: false }]
}

const indentStyle = computed(() => ({
  paddingLeft: `${props.depth * 16 + 4}px`,
}))

// ---------- 右键菜单：复制 ----------
async function copyPath() {
  const path = nodeKey.value.replace(/^\$\./, '')
  await copy(path)
  toast({ title: '已复制属性路径', description: path })
}

async function copyValue() {
  let text: string
  if (props.value === null) text = 'null'
  else if (typeof props.value === 'string') text = props.value
  else if (typeof props.value === 'object') text = beautify(props.value, Number(store.indentSize))
  else text = String(props.value)
  await copy(text)
  toast({ title: '已复制值', description: text.length > 60 ? text.slice(0, 60) + '…' : text })
}

async function copyObject() {
  const text = beautify(props.value, Number(store.indentSize))
  await copy(text)
  toast({ title: '已复制对象', description: text.length > 60 ? text.slice(0, 60) + '…' : text })
}

// 就地展开/收起当前子树
function expandSubtree() {
  const visit = (val: unknown, segs: PathSegment[]) => {
    if (Array.isArray(val)) {
      store.setExpanded(segs, true)
      val.forEach((item, i) => visit(item, [...segs, i]))
    } else if (val && typeof val === 'object') {
      store.setExpanded(segs, true)
      for (const [k, v] of Object.entries(val)) visit(v, [...segs, k])
    }
  }
  visit(props.value, props.segments)
  toast({ title: '已展开当前子树' })
}

function collapseSubtree() {
  const visit = (val: unknown, segs: PathSegment[]) => {
    if (Array.isArray(val)) {
      store.setExpanded(segs, false)
      val.forEach((item, i) => visit(item, [...segs, i]))
    } else if (val && typeof val === 'object') {
      store.setExpanded(segs, false)
      for (const [k, v] of Object.entries(val)) visit(v, [...segs, k])
    }
  }
  visit(props.value, props.segments)
  toast({ title: '已收起当前子树' })
}
</script>

<template>
  <div
    class="json-node"
    :data-node-key="nodeKey"
    :data-match="isMatch ? '' : undefined"
    :data-current="isCurrentMatch ? '' : undefined"
  >
    <ContextMenu>
      <ContextMenuTrigger as-child>
        <div
          ref="rowRef"
          class="group flex cursor-default items-baseline gap-1 rounded-sm px-1 py-px font-mono text-[13px] leading-5 hover:bg-accent/50"
          :class="{
            'ring-2 ring-primary/70 ring-inset rounded': isCurrentMatch,
          }"
          :style="indentStyle"
          @click="toggle"
        >
          <span
            class="inline-flex w-4 shrink-0 items-center justify-center text-muted-foreground transition-transform group-hover:text-foreground"
            :class="{ invisible: !hasChildren }"
          >
            <component
              :is="expanded ? ChevronDown : ChevronRight"
              class="size-3.5"
            />
          </span>

          <span v-if="keyName !== undefined" class="text-json-key">
            <template
              v-for="(part, index) in highlightText(String(keyName))"
              :key="index"
            >
              <mark
                v-if="part.isMatch"
                class="rounded-sm bg-amber-200 px-px text-inherit dark:bg-amber-500/40"
              >{{ part.text }}</mark>
              <template v-else>{{ part.text }}</template>
            </template>
            <span class="text-muted-foreground">:</span>
          </span>

          <template v-if="isContainer">
            <span class="text-muted-foreground">{{ openBracket }}</span>
            <span
              v-if="hasChildren && !expanded"
              class="ml-0.5 text-[12px] text-muted-foreground/70"
            >
              {{ summary(value) }}
            </span>
            <span
              v-if="!hasChildren || !expanded"
              class="text-muted-foreground"
            >{{ closeBracket }}</span>
          </template>

          <span
            v-else
            class="break-all"
            :class="{
              'text-json-string': nodeType === 'string',
              'text-json-number': nodeType === 'number',
              'text-json-boolean': nodeType === 'boolean',
              'text-json-null italic': nodeType === 'null',
            }"
          >
            <template
              v-for="(part, index) in highlightText(displayValue())"
              :key="index"
            >
              <mark
                v-if="part.isMatch"
                class="rounded-sm bg-amber-200 px-px text-inherit dark:bg-amber-500/40"
              >{{ part.text }}</mark>
              <template v-else>{{ part.text }}</template>
            </template>
          </span>

          <span v-if="!isLast && depth > 0" class="text-muted-foreground">,</span>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent class="w-56">
        <ContextMenuLabel class="truncate">{{ nodeKey }}</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem @select="copyPath">
          <Copy class="size-4" /> 复制属性路径
        </ContextMenuItem>
        <ContextMenuItem @select="copyValue">
          <FileJson class="size-4" /> 复制值
        </ContextMenuItem>
        <ContextMenuItem v-if="isContainer" @select="copyObject">
          <Braces class="size-4" /> 复制对象
        </ContextMenuItem>
        <template v-if="isContainer && hasChildren">
          <ContextMenuSeparator />
          <ContextMenuItem @select="expandSubtree">
            <ChevronsUpDown class="size-4" /> 展开当前子树
          </ContextMenuItem>
          <ContextMenuItem @select="collapseSubtree">
            <ChevronsDownUp class="size-4" /> 收起当前子树
          </ContextMenuItem>
        </template>
      </ContextMenuContent>
    </ContextMenu>

    <!-- 子节点 -->
    <div
      v-if="isContainer && hasChildren && expanded"
      class="border-l border-border/60 ml-[19px] mt-px"
    >
      <JsonNode
        v-for="([k, v], idx) in entries"
        :key="String(k)"
        :value="v"
        :key-name="k"
        :segments="[...segments, k]"
        :depth="depth + 1"
        :is-last="idx === entries.length - 1"
      />
    </div>

    <!-- 闭合括号 -->
    <div
      v-if="isContainer && hasChildren && expanded"
      class="font-mono text-[13px] leading-5 text-muted-foreground"
      :style="{ paddingLeft: `${depth * 16 + 4}px` }"
    >
      <span class="inline-block w-4"></span>
      <span>{{ closeBracket }}</span>
      <span v-if="!isLast && depth > 0">,</span>
    </div>
  </div>
</template>
