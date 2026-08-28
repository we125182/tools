import type { Editor, Range } from '@tiptap/core'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TaskItem } from '@tiptap/extension-task-item'
import { TaskList } from '@tiptap/extension-task-list'
import { Typography } from '@tiptap/extension-typography'
import { Markdown } from '@tiptap/markdown'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import {
  Bold,
  Check,
  CheckSquare,
  Code2,
  Copy,
  Download,
  FileText,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  Upload,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Tooltip } from '@/components/ui/tooltip'
import { composeMarkdownDocument, findSlashTrigger, markdownFileName, splitMarkdownDocument } from '@/lib/markdown-editor'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'jt:markdown-document'
const DEFAULT_DOCUMENT = {
  title: '产品发布计划',
  markdown: `这是一份使用 **Tiptap 3** 编辑的 Markdown 文档。排版会在输入时即时呈现，保存时仍然保持为标准 Markdown。

## 本周重点

- [x] 完成编辑器基础体验
- [ ] 整理发布说明
- [ ] 邀请团队评审

> 清晰的文档让决策更容易被理解。

## 备注

可以直接继续编辑这份文档。`,
}

type StoredDocument = typeof DEFAULT_DOCUMENT
type SaveState = 'saved' | 'saving'
type SlashMenuState = {
  left: number
  placeAbove: boolean
  query: string
  range: Range
  top: number
}
type SlashCommand = {
  description: string
  icon: LucideIcon
  id: string
  keywords: string[]
  label: string
  run: (editor: Editor, range: Range) => void
}

const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: {
      autolink: true,
      defaultProtocol: 'https',
      openOnClick: false,
    },
  }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Typography,
  Placeholder.configure({ placeholder: '开始写作...' }),
  Markdown.configure({ indentation: { style: 'space', size: 2 } }),
]

const slashCommands: SlashCommand[] = [
  {
    id: 'paragraph',
    label: '正文',
    description: '普通文本段落',
    icon: Pilcrow,
    keywords: ['paragraph', 'text', '正文', '文本'],
    run: (editor, range) => { editor.chain().focus().deleteRange(range).setParagraph().run() },
  },
  {
    id: 'heading-1',
    label: '一级标题',
    description: '页面主标题',
    icon: Heading1,
    keywords: ['h1', 'heading', 'title', '一级标题'],
    run: (editor, range) => { editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run() },
  },
  {
    id: 'heading-2',
    label: '二级标题',
    description: '章节标题',
    icon: Heading2,
    keywords: ['h2', 'heading', 'subtitle', '二级标题'],
    run: (editor, range) => { editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run() },
  },
  {
    id: 'bullet-list',
    label: '项目列表',
    description: '创建无序列表',
    icon: List,
    keywords: ['bullet', 'list', 'ul', '项目列表', '无序列表'],
    run: (editor, range) => { editor.chain().focus().deleteRange(range).toggleBulletList().run() },
  },
  {
    id: 'ordered-list',
    label: '编号列表',
    description: '创建有序列表',
    icon: ListOrdered,
    keywords: ['ordered', 'list', 'ol', '编号列表', '有序列表'],
    run: (editor, range) => { editor.chain().focus().deleteRange(range).toggleOrderedList().run() },
  },
  {
    id: 'task-list',
    label: '待办列表',
    description: '带复选框的任务',
    icon: CheckSquare,
    keywords: ['task', 'todo', 'check', '待办列表', '任务'],
    run: (editor, range) => { editor.chain().focus().deleteRange(range).toggleTaskList().run() },
  },
  {
    id: 'blockquote',
    label: '引用',
    description: '突出显示引用内容',
    icon: Quote,
    keywords: ['quote', 'blockquote', '引用'],
    run: (editor, range) => { editor.chain().focus().deleteRange(range).toggleBlockquote().run() },
  },
  {
    id: 'code-block',
    label: '代码块',
    description: '等宽字体代码区域',
    icon: Code2,
    keywords: ['code', 'pre', '代码块'],
    run: (editor, range) => { editor.chain().focus().deleteRange(range).toggleCodeBlock().run() },
  },
  {
    id: 'divider',
    label: '分割线',
    description: '分隔不同内容区块',
    icon: Minus,
    keywords: ['divider', 'rule', 'hr', '分割线'],
    run: (editor, range) => { editor.chain().focus().deleteRange(range).setHorizontalRule().run() },
  },
]

function loadDocument(): StoredDocument {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_DOCUMENT
    const parsed = JSON.parse(stored) as Partial<StoredDocument>
    return {
      title: typeof parsed.title === 'string' ? parsed.title : DEFAULT_DOCUMENT.title,
      markdown: typeof parsed.markdown === 'string' ? parsed.markdown : DEFAULT_DOCUMENT.markdown,
    }
  } catch {
    return DEFAULT_DOCUMENT
  }
}

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    textarea.remove()
    return copied
  }
}

function ToolbarButton({ active = false, disabled = false, icon: Icon, label, onClick }: {
  active?: boolean
  disabled?: boolean
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <Tooltip content={label}>
      <Button
        type="button"
        variant={active ? 'secondary' : 'ghost'}
        size="icon"
        aria-label={label}
        aria-pressed={active || undefined}
        disabled={disabled}
        onClick={onClick}
      >
        <Icon size={16} />
      </Button>
    </Tooltip>
  )
}

function EditorToolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      canRedo: currentEditor.can().redo(),
      canUndo: currentEditor.can().undo(),
      isBlockquote: currentEditor.isActive('blockquote'),
      isBold: currentEditor.isActive('bold'),
      isBulletList: currentEditor.isActive('bulletList'),
      isCode: currentEditor.isActive('code'),
      isHeading1: currentEditor.isActive('heading', { level: 1 }),
      isHeading2: currentEditor.isActive('heading', { level: 2 }),
      isItalic: currentEditor.isActive('italic'),
      isOrderedList: currentEditor.isActive('orderedList'),
      isParagraph: currentEditor.isActive('paragraph'),
      isStrike: currentEditor.isActive('strike'),
      isTaskList: currentEditor.isActive('taskList'),
    }),
  })

  return (
    <div className="flex min-w-max items-center gap-0.5" role="toolbar" aria-label="编辑器格式">
      <ToolbarButton icon={Undo2} label="撤销" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()} />
      <ToolbarButton icon={Redo2} label="重做" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()} />
      <ToolbarButton icon={Pilcrow} label="正文" active={state.isParagraph} onClick={() => editor.chain().focus().setParagraph().run()} />
      <ToolbarButton icon={Heading1} label="一级标题" active={state.isHeading1} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
      <ToolbarButton icon={Heading2} label="二级标题" active={state.isHeading2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
      <ToolbarButton icon={Bold} label="加粗" active={state.isBold} onClick={() => editor.chain().focus().toggleBold().run()} />
      <ToolbarButton icon={Italic} label="斜体" active={state.isItalic} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <ToolbarButton icon={Strikethrough} label="删除线" active={state.isStrike} onClick={() => editor.chain().focus().toggleStrike().run()} />
      <ToolbarButton icon={Code2} label="行内代码" active={state.isCode} onClick={() => editor.chain().focus().toggleCode().run()} />
      <ToolbarButton icon={List} label="项目列表" active={state.isBulletList} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <ToolbarButton icon={ListOrdered} label="编号列表" active={state.isOrderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      <ToolbarButton icon={CheckSquare} label="待办列表" active={state.isTaskList} onClick={() => editor.chain().focus().toggleTaskList().run()} />
      <ToolbarButton icon={Quote} label="引用" active={state.isBlockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
    </div>
  )
}

function SlashMenu({ activeIndex, commands, menu, onSelect }: {
  activeIndex: number
  commands: SlashCommand[]
  menu: SlashMenuState
  onSelect: (command: SlashCommand) => void
}) {
  return (
    <div
      className="fixed z-50 w-72 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg"
      style={{
        left: `${menu.left}px`,
        top: `${menu.top}px`,
        transform: menu.placeAbove ? 'translateY(-100%)' : undefined,
      }}
    >
      <Command shouldFilter={false} value={commands[activeIndex]?.id} aria-label="快捷输入">
        <CommandList className="max-h-80">
          <CommandEmpty>没有匹配的内容块</CommandEmpty>
          <CommandGroup heading="基础块">
            {commands.map((command, index) => {
              const Icon = command.icon
              return (
                <CommandItem
                  key={command.id}
                  value={command.id}
                  aria-selected={index === activeIndex}
                  className={cn(index === activeIndex && 'bg-accent text-accent-foreground')}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    onSelect(command)
                  }}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{command.label}</div>
                    <div className="truncate text-xs text-muted-foreground">{command.description}</div>
                  </div>
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
}

export function MarkdownEditorPage() {
  const [initialDocument] = useState(loadDocument)
  const [title, setTitle] = useState(initialDocument.title)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [copied, setCopied] = useState(false)
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null)
  const [activeCommandIndex, setActiveCommandIndex] = useState(0)
  const titleRef = useRef(initialDocument.title)
  const latestMarkdownRef = useRef(initialDocument.markdown)
  const saveTimerRef = useRef<number | null>(null)
  const copiedTimerRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scheduleSave = useCallback((markdown: string) => {
    latestMarkdownRef.current = markdown
    setSaveState('saving')
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ title: titleRef.current, markdown }))
      } catch {
        // Keep editing available even when browser storage is disabled.
      } finally {
        setSaveState('saved')
      }
    }, 350)
  }, [])

  const refreshSlashMenu = useCallback((editor: Editor) => {
    const { selection } = editor.state
    const parent = selection.$from.parent
    if (!selection.empty || !parent.isTextblock || parent.type.name === 'codeBlock') {
      setSlashMenu(null)
      return
    }

    const textBeforeCursor = parent.textBetween(0, selection.$from.parentOffset, undefined, '\ufffc')
    const trigger = findSlashTrigger(textBeforeCursor, selection.from)
    if (!trigger) {
      setSlashMenu(null)
      return
    }

    const coords = editor.view.coordsAtPos(selection.from)
    const menuWidth = 288
    const estimatedMenuHeight = 360
    const placeAbove = coords.bottom + estimatedMenuHeight > window.innerHeight
    setSlashMenu({
      left: Math.max(12, Math.min(coords.left, window.innerWidth - menuWidth - 12)),
      placeAbove,
      query: trigger.query,
      range: { from: trigger.from, to: trigger.to },
      top: placeAbove ? coords.top - 8 : coords.bottom + 8,
    })
  }, [])

  const editor = useEditor({
    extensions: editorExtensions,
    content: initialDocument.markdown,
    contentType: 'markdown',
    editorProps: {
      attributes: {
        'aria-label': 'Markdown 正文',
        class: 'min-h-[calc(100vh-14rem)] outline-none',
      },
    },
    onSelectionUpdate: ({ editor }) => refreshSlashMenu(editor),
    onUpdate: ({ editor }) => {
      scheduleSave(editor.getMarkdown())
      refreshSlashMenu(editor)
    },
  })

  const filteredCommands = useMemo(() => {
    const query = slashMenu?.query.trim().toLocaleLowerCase() ?? ''
    if (!query) return slashCommands
    return slashCommands.filter((command) => [command.label, command.description, ...command.keywords]
      .some((value) => value.toLocaleLowerCase().includes(query)))
  }, [slashMenu?.query])

  useEffect(() => setActiveCommandIndex(0), [slashMenu?.query])

  useEffect(() => () => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current)
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ title: titleRef.current, markdown: latestMarkdownRef.current }))
      } catch {
        // The latest edit remains in memory when browser storage is unavailable.
      }
    }
    if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current)
  }, [])

  const selectSlashCommand = useCallback((command: SlashCommand) => {
    if (!editor || !slashMenu) return
    command.run(editor, slashMenu.range)
    setSlashMenu(null)
  }, [editor, slashMenu])

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!slashMenu || event.nativeEvent.isComposing) return
    if (event.key === 'Escape') {
      event.preventDefault()
      setSlashMenu(null)
      return
    }
    if (!filteredCommands.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveCommandIndex((current) => (current + 1) % filteredCommands.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveCommandIndex((current) => (current - 1 + filteredCommands.length) % filteredCommands.length)
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      selectSlashCommand(filteredCommands[activeCommandIndex] ?? filteredCommands[0]!)
    }
  }

  const handleTitleChange = (nextTitle: string) => {
    setTitle(nextTitle)
    titleRef.current = nextTitle
    scheduleSave(editor?.getMarkdown() ?? initialDocument.markdown)
  }

  const copyMarkdown = async () => {
    if (!editor) return
    const copied = await writeClipboard(composeMarkdownDocument(titleRef.current, editor.getMarkdown()))
    if (!copied) return
    setCopied(true)
    if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current)
    copiedTimerRef.current = window.setTimeout(() => setCopied(false), 1800)
  }

  const exportMarkdown = () => {
    if (!editor) return
    const markdown = composeMarkdownDocument(titleRef.current, editor.getMarkdown())
    const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = markdownFileName(title)
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const importMarkdown = async (file: File) => {
    if (!editor) return
    const markdown = await file.text()
    const imported = splitMarkdownDocument(markdown, file.name.replace(/\.(md|markdown)$/i, ''))
    titleRef.current = imported.title
    setTitle(imported.title)
    editor.commands.setContent(imported.body, { contentType: 'markdown' })
    scheduleSave(imported.body)
    editor.commands.focus('start')
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
        <FileText className="shrink-0 text-muted-foreground" size={16} />
        <span className="hidden text-xs text-muted-foreground sm:inline">Markdown</span>
        <span className="hidden text-muted-foreground sm:inline">/</span>
        <span className="min-w-0 truncate text-xs font-medium">{title.trim() || '无标题'}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground" role="status">
          {saveState === 'saved' && <Check size={13} />}
          {saveState === 'saved' ? '已保存' : '保存中'}
        </span>
        <Tooltip content={copied ? '已复制 Markdown' : '复制 Markdown'}>
          <Button type="button" variant="ghost" size="icon" aria-label="复制 Markdown" onClick={() => void copyMarkdown()} disabled={!editor}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </Button>
        </Tooltip>
        <Tooltip content="导入 Markdown">
          <Button type="button" variant="ghost" size="icon" aria-label="导入 Markdown" onClick={() => fileInputRef.current?.click()} disabled={!editor}>
            <Upload size={16} />
          </Button>
        </Tooltip>
        <Tooltip content="导出 Markdown">
          <Button type="button" variant="ghost" size="icon" aria-label="导出 Markdown" onClick={exportMarkdown} disabled={!editor}>
            <Download size={16} />
          </Button>
        </Tooltip>
        <input
          ref={fileInputRef}
          className="hidden"
          type="file"
          accept="text/markdown,.md,.markdown,text/plain"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void importMarkdown(file)
          }}
        />
      </header>

      <div className="shrink-0 overflow-x-auto border-b bg-background/95 px-2 py-1.5 sm:px-4">
        {editor && <EditorToolbar editor={editor} />}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto" onScroll={() => setSlashMenu(null)}>
        <article className="markdown-editor mx-auto w-full max-w-3xl px-6 pt-10 pb-32 sm:px-12 sm:pt-14">
          <input
            className="mb-8 w-full bg-transparent text-4xl font-bold text-foreground outline-none placeholder:text-muted-foreground/60"
            value={title}
            placeholder="无标题"
            aria-label="文档标题"
            onChange={(event) => handleTitleChange(event.target.value)}
          />
          <EditorContent editor={editor} onKeyDownCapture={handleEditorKeyDown} />
        </article>
      </div>

      {slashMenu && (
        <SlashMenu
          activeIndex={activeCommandIndex}
          commands={filteredCommands}
          menu={slashMenu}
          onSelect={selectSlashCommand}
        />
      )}
    </main>
  )
}
