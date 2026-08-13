import {
  AlarmClock,
  BellRing,
  CalendarClock,
  Check,
  Circle,
  CircleCheckBig,
  CircleDot,
  ClipboardList,
  Columns3,
  List,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react'
import { Button } from '@/components/ui/button'
import { RadioGroup, type RadioOption } from '@/components/ui/radio-group'
import { Tooltip } from '@/components/ui/tooltip'
import { notifyTaskDue, requestTaskNotificationPermission } from '@/lib/task-notifications'
import {
  getDueTasks,
  todoStatuses,
  type TodoPriority,
  type TodoStatus,
  type TodoTask,
  useTodoStore,
} from '@/stores/todos'

type TodoView = 'list' | 'board'

const statusOptions = [
  { value: 'not-started', label: '未开始' },
  { value: 'in-progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
] satisfies ReadonlyArray<RadioOption<TodoStatus>>

const priorityOptions = [
  { value: 'normal', label: '普通' },
  { value: 'urgent', label: '紧急' },
] satisfies ReadonlyArray<RadioOption<TodoPriority>>

const priorityStyle: Record<TodoPriority, string> = {
  normal: 'text-muted-foreground',
  urgent: 'text-destructive',
}

function statusLabel(status: TodoStatus): string {
  return statusOptions.find((option) => option.value === status)?.label ?? '未开始'
}

function priorityLabel(priority: TodoPriority): string {
  return priorityOptions.find((option) => option.value === priority)?.label ?? '普通'
}

function StatusIcon({ status, size = 16 }: { status: TodoStatus; size?: number }) {
  if (status === 'completed') return <CircleCheckBig size={size} />
  if (status === 'in-progress') return <CircleDot size={size} />
  return <Circle size={size} />
}

function toDatetimeLocal(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const parts = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')]
  const time = [String(date.getHours()).padStart(2, '0'), String(date.getMinutes()).padStart(2, '0')]
  return `${parts.join('-')}T${time.join(':')}`
}

function formatDueAt(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function isPastDue(task: TodoTask): boolean {
  return task.status !== 'completed' && task.dueAt !== null && new Date(task.dueAt).getTime() <= Date.now()
}

function TaskComposer() {
  const addTask = useTodoStore((state) => state.addTask)
  const [title, setTitle] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [status, setStatus] = useState<TodoStatus>('not-started')
  const [dueAt, setDueAt] = useState('')
  const [priority, setPriority] = useState<TodoPriority>('normal')
  const [notes, setNotes] = useState('')

  const reset = () => {
    setTitle('')
    setStatus('not-started')
    setDueAt('')
    setPriority('normal')
    setNotes('')
    setShowDetails(false)
  }

  return (
    <form
      className="border-b bg-muted/20 px-4 py-3 sm:px-6"
      onSubmit={(event) => {
        event.preventDefault()
        if (addTask({ title, status, dueAt: dueAt || null, priority, notes })) reset()
      }}
    >
      <div className="flex items-center gap-2">
        <input
          className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="添加任务"
          aria-label="任务内容"
        />
        <Tooltip content={showDetails ? '收起详细编辑' : '展开详细编辑'}>
          <Button type="button" variant={showDetails ? 'secondary' : 'outline'} size="icon" aria-label={showDetails ? '收起详细编辑' : '展开详细编辑'} aria-pressed={showDetails} onClick={() => setShowDetails((value) => !value)}>
            <Settings2 size={16} />
          </Button>
        </Tooltip>
        <Button type="submit" size="icon" aria-label="添加任务" disabled={!title.trim()}><Plus size={18} /></Button>
      </div>
      {showDetails && <div className="mt-3 grid items-start gap-3 border-t pt-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-1.5 self-start text-xs text-muted-foreground"><span>状态</span><RadioGroup value={status} options={statusOptions} onValueChange={setStatus} aria-label="新任务状态" /></div>
        <label className="grid gap-1.5 self-start text-xs text-muted-foreground">截止时间<input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="h-8 rounded-md border bg-background px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="新任务截止时间" /></label>
        <div className="grid gap-1.5 self-start text-xs text-muted-foreground"><span>优先级</span><RadioGroup value={priority} options={priorityOptions} onValueChange={setPriority} aria-label="新任务优先级" /></div>
        <label className="grid gap-1.5 self-start text-xs text-muted-foreground sm:col-span-2 lg:col-span-1">备注<input value={notes} onChange={(event) => setNotes(event.target.value)} className="h-8 rounded-md border bg-background px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="新任务备注" /></label>
      </div>}
    </form>
  )
}

function TaskCard({
  task,
  compact = false,
  draggable = false,
  onDragStart,
  onDragEnd,
}: {
  task: TodoTask
  compact?: boolean
  draggable?: boolean
  onDragStart?: (taskId: string) => void
  onDragEnd?: () => void
}) {
  const updateTask = useTodoStore((state) => state.updateTask)
  const deleteTask = useTodoStore((state) => state.deleteTask)
  const [editing, setEditing] = useState(false)
  const overdue = isPastDue(task)
  const nextStatus = task.status === 'completed' ? 'not-started' : 'completed'

  return (
    <article
      draggable={draggable}
      className={`rounded-md border bg-card p-3 ${task.status === 'completed' ? 'opacity-65' : ''} ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onDragStart={(event) => {
        if (!draggable) return
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', task.id)
        onDragStart?.(task.id)
      }}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-start gap-2">
        <Tooltip content={task.status === 'completed' ? '标记为未开始' : '标记为已完成'}>
          <Button type="button" variant="ghost" size="icon-sm" className={`size-5 shrink-0 ${task.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} aria-label={`${task.status === 'completed' ? '标记为未开始' : '标记为已完成'}：${task.title}`} onClick={() => updateTask(task.id, { status: nextStatus })}>
            {task.status === 'completed' ? <Check size={14} /> : <Circle size={14} />}
          </Button>
        </Tooltip>
        <div className="min-w-0 flex-1">
          <p className={`break-words text-sm leading-5 ${task.status === 'completed' ? 'line-through' : ''}`}>{task.title}</p>
          {!compact && <TaskMeta task={task} overdue={overdue} />}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Tooltip content={editing ? '收起任务编辑' : '编辑任务'}>
            <Button type="button" variant={editing ? 'secondary' : 'ghost'} size="icon-sm" aria-label={editing ? `收起 ${task.title} 的编辑` : `编辑 ${task.title}`} onClick={() => setEditing((value) => !value)}><Pencil size={14} /></Button>
          </Tooltip>
          <Tooltip content="删除任务"><Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" aria-label={`删除 ${task.title}`} onClick={() => deleteTask(task.id)}><Trash2 size={14} /></Button></Tooltip>
        </div>
      </div>
      {compact && <TaskMeta task={task} overdue={overdue} />}
      {editing && <div className="mt-3 grid items-start gap-3 border-t pt-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs text-muted-foreground sm:col-span-2">任务内容<input defaultValue={task.title} onBlur={(event) => updateTask(task.id, { title: event.target.value })} className="h-8 rounded-md border bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${task.title} 的任务内容`} /></label>
        <div className="grid gap-1.5 self-start text-xs text-muted-foreground"><span>状态</span><RadioGroup value={task.status} options={statusOptions} onValueChange={(status) => updateTask(task.id, { status })} aria-label={`${task.title} 的状态`} /></div>
        <label className="grid gap-1.5 text-xs text-muted-foreground">截止时间<input type="datetime-local" value={toDatetimeLocal(task.dueAt)} onChange={(event) => updateTask(task.id, { dueAt: event.target.value || null })} className="h-8 rounded-md border bg-background px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${task.title} 的截止时间`} /></label>
        <div className="grid gap-1.5 self-start text-xs text-muted-foreground"><span>优先级</span><RadioGroup value={task.priority} options={priorityOptions} onValueChange={(priority) => updateTask(task.id, { priority })} aria-label={`${task.title} 的优先级`} /></div>
        <label className="grid gap-1.5 text-xs text-muted-foreground">备注<textarea defaultValue={task.notes} onBlur={(event) => updateTask(task.id, { notes: event.target.value })} className="min-h-16 resize-y rounded-md border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${task.title} 的备注`} /></label>
      </div>}
    </article>
  )
}

function TaskMeta({ task, overdue }: { task: TodoTask; overdue: boolean }) {
  return <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
    {task.dueAt && <span className={`flex items-center gap-1 ${overdue ? 'font-medium text-destructive' : ''}`}><CalendarClock size={12} />{overdue ? '已到期 ' : ''}{formatDueAt(task.dueAt)}</span>}
    <span className={`flex items-center gap-1 ${priorityStyle[task.priority]}`}><Circle size={8} fill="currentColor" />{priorityLabel(task.priority)}</span>
    {task.notes && <span className="max-w-full truncate" title={task.notes}>{task.notes}</span>}
  </div>
}

function EmptyState() {
  return <div className="flex flex-1 items-center justify-center px-6 py-16 text-center text-sm text-muted-foreground"><div><ClipboardList className="mx-auto mb-3" size={26} /><p>还没有任务</p></div></div>
}

function ListView({ tasks }: { tasks: TodoTask[] }) {
  if (!tasks.length) return <EmptyState />
  return <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 p-4 sm:p-6">{tasks.map((task) => <TaskCard key={task.id} task={task} />)}</div>
}

function BoardView({ tasks }: { tasks: TodoTask[] }) {
  const updateTask = useTodoStore((state) => state.updateTask)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<TodoStatus | null>(null)
  const columns = todoStatuses.map((status) => ({ status, tasks: tasks.filter((task) => task.status === status) }))

  const dropTask = (event: DragEvent<HTMLElement>, status: TodoStatus) => {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/plain') || draggingTaskId
    const task = tasks.find((item) => item.id === taskId)
    if (task && task.status !== status) updateTask(task.id, { status })
    setDraggingTaskId(null)
    setDropTarget(null)
  }

  return <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6"><div className="mx-auto grid min-w-[780px] max-w-7xl grid-cols-3 gap-4">
    {columns.map((column) => <section
      key={column.status}
      className={`flex min-h-52 flex-col rounded-md border p-2.5 transition-colors ${dropTarget === column.status ? 'border-primary bg-primary/5' : 'bg-muted/25'}`}
      aria-label={statusLabel(column.status)}
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
      }}
      onDragEnter={() => setDropTarget(column.status)}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setDropTarget(null)
      }}
      onDrop={(event) => dropTask(event, column.status)}
    >
      <header className="mb-2 flex items-center gap-2 px-1 text-sm font-medium"><StatusIcon status={column.status} size={15} /><span>{statusLabel(column.status)}</span><span className="ml-auto font-mono text-xs text-muted-foreground">{column.tasks.length}</span></header>
      <div className="min-h-20 flex-1 space-y-2">{column.tasks.map((task) => <TaskCard key={task.id} task={task} compact draggable onDragStart={setDraggingTaskId} onDragEnd={() => { setDraggingTaskId(null); setDropTarget(null) }} />)}</div>
    </section>)}
  </div></div>
}

export function TodoPage() {
  const tasks = useTodoStore((state) => state.tasks)
  const markDueNotified = useTodoStore((state) => state.markDueNotified)
  const [view, setView] = useState<TodoView>('list')
  const [notice, setNotice] = useState<string | null>(null)
  const orderedTasks = useMemo(() => [...tasks].sort((left, right) => {
    if (left.status === 'completed' !== (right.status === 'completed')) return left.status === 'completed' ? 1 : -1
    return right.updatedAt.localeCompare(left.updatedAt)
  }), [tasks])

  const checkDueTasks = useCallback(() => {
    const dueTasks = getDueTasks(useTodoStore.getState().tasks)
    if (!dueTasks.length) return
    dueTasks.forEach((task) => {
      markDueNotified(task.id)
      void notifyTaskDue(task.title)
    })
    setNotice(dueTasks.length === 1 ? `任务“${dueTasks[0]!.title}”已到截止时间` : `${dueTasks.length} 个任务已到截止时间`)
  }, [markDueNotified])

  useEffect(() => {
    checkDueTasks()
    const nextDueAt = tasks
      .filter((task) => task.status !== 'completed' && task.dueAt !== null && task.notifiedAt === null)
      .map((task) => new Date(task.dueAt!).getTime())
      .filter((dueAt) => dueAt > Date.now())
      .sort((left, right) => left - right)[0]
    const dueTimeout = nextDueAt === undefined ? null : window.setTimeout(checkDueTasks, nextDueAt - Date.now())
    const interval = window.setInterval(checkDueTasks, 60_000)
    return () => {
      if (dueTimeout !== null) window.clearTimeout(dueTimeout)
      window.clearInterval(interval)
    }
  }, [checkDueTasks, tasks])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), 5000)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const enableNotifications = async () => {
    const result = await requestTaskNotificationPermission()
    if (result === 'granted') setNotice('任务提醒已开启')
    else if (result === 'unsupported') setNotice('当前环境不支持系统通知')
    else setNotice('未获得系统通知权限')
  }

  return <main className="relative flex min-h-0 flex-1 flex-col">
    <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b px-4 py-2 sm:px-6">
      <div className="flex items-center gap-2 text-sm font-medium"><ClipboardList size={17} /><span>全部任务</span><span className="font-mono text-xs text-muted-foreground">{tasks.length}</span></div>
      <div className="ml-auto flex items-center gap-1">
        <Tooltip content="开启系统提醒"><Button type="button" variant="ghost" size="icon" aria-label="开启系统提醒" onClick={() => void enableNotifications()}><BellRing size={16} /></Button></Tooltip>
        <div className="flex items-center rounded-md border bg-background p-0.5" aria-label="任务视图">
          <Tooltip content="列表视图"><Button type="button" variant={view === 'list' ? 'secondary' : 'ghost'} size="icon-sm" aria-label="列表视图" aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={15} /></Button></Tooltip>
          <Tooltip content="看板视图"><Button type="button" variant={view === 'board' ? 'secondary' : 'ghost'} size="icon-sm" aria-label="看板视图" aria-pressed={view === 'board'} onClick={() => setView('board')}><Columns3 size={15} /></Button></Tooltip>
        </div>
      </div>
    </header>
    <TaskComposer />
    <section className="min-h-0 flex-1 overflow-auto" aria-label={view === 'list' ? '任务列表' : '任务看板'}>{view === 'list' ? <ListView tasks={orderedTasks} /> : <BoardView tasks={orderedTasks} />}</section>
    {notice && <div role="status" className="fixed top-4 right-4 z-30 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg"><AlarmClock size={16} className="shrink-0" /><span>{notice}</span><Button type="button" variant="ghost" size="icon-sm" className="shrink-0 text-muted-foreground" aria-label="关闭提示" onClick={() => setNotice(null)}><X size={14} /></Button></div>}
  </main>
}

export function QuickTodoPage() {
  const tasks = useTodoStore((state) => state.tasks)
  const orderedTasks = useMemo(() => [...tasks].sort((left, right) => {
    if (left.status === 'completed' !== (right.status === 'completed')) return left.status === 'completed' ? 1 : -1
    return right.updatedAt.localeCompare(left.updatedAt)
  }), [tasks])

  return <main className="flex h-screen min-h-0 flex-col bg-background text-foreground">
    <TaskComposer />
    <section className="min-h-0 flex-1 overflow-auto" aria-label="任务列表"><ListView tasks={orderedTasks} /></section>
  </main>
}
