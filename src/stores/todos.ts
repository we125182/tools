import { create } from 'zustand'

export const todoStatuses = ['not-started', 'in-progress', 'completed'] as const
export type TodoStatus = typeof todoStatuses[number]

export const todoPriorities = ['normal', 'urgent'] as const
export type TodoPriority = typeof todoPriorities[number]

export interface TodoTask {
  id: string
  title: string
  status: TodoStatus
  dueAt: string | null
  priority: TodoPriority
  notes: string
  createdAt: string
  updatedAt: string
  notifiedAt: string | null
}

export interface TodoTaskInput {
  title: string
  status?: TodoStatus
  dueAt?: string | null
  priority?: TodoPriority
  notes?: string
}

interface TodoStore {
  tasks: TodoTask[]
  addTask: (input: TodoTaskInput) => TodoTask | null
  updateTask: (id: string, input: Partial<TodoTaskInput>) => void
  deleteTask: (id: string) => void
  markDueNotified: (id: string) => void
  reset: () => void
}

const storage = typeof window === 'undefined' ? undefined : window.localStorage

function uid(): string {
  return `todo-${Math.random().toString(36).slice(2, 10)}`
}

function isStatus(value: unknown): value is TodoStatus {
  return typeof value === 'string' && todoStatuses.includes(value as TodoStatus)
}

function normalizePriority(value: unknown): TodoPriority {
  return value === 'urgent' || value === 'high' ? 'urgent' : 'normal'
}

function normalizeDueAt(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function normalizeTask(value: Partial<TodoTask>): TodoTask | null {
  const title = typeof value.title === 'string' ? value.title.trim() : ''
  if (!title) return null
  const now = new Date().toISOString()
  return {
    id: typeof value.id === 'string' && value.id ? value.id : uid(),
    title,
    status: isStatus(value.status) ? value.status : 'not-started',
    dueAt: normalizeDueAt(value.dueAt),
    priority: normalizePriority(value.priority),
    notes: typeof value.notes === 'string' ? value.notes : '',
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
    notifiedAt: normalizeDueAt(value.notifiedAt),
  }
}

function readTasks(): TodoTask[] {
  try {
    const value = JSON.parse(storage?.getItem('jt:todos') ?? '[]')
    return Array.isArray(value)
      ? value.map((item) => item && typeof item === 'object' ? normalizeTask(item as Partial<TodoTask>) : null).filter((item): item is TodoTask => item !== null)
      : []
  } catch {
    return []
  }
}

function persist(tasks: TodoTask[]) {
  try {
    storage?.setItem('jt:todos', JSON.stringify(tasks))
  } catch {
    // Storage failures must not prevent task editing.
  }
}

function createTask(input: TodoTaskInput): TodoTask | null {
  const title = input.title.trim()
  if (!title) return null
  const now = new Date().toISOString()
  return {
    id: uid(),
    title,
    status: isStatus(input.status) ? input.status : 'not-started',
    dueAt: normalizeDueAt(input.dueAt),
    priority: normalizePriority(input.priority),
    notes: input.notes ?? '',
    createdAt: now,
    updatedAt: now,
    notifiedAt: null,
  }
}

export function getDueTasks(tasks: TodoTask[], now = Date.now()): TodoTask[] {
  return tasks.filter((task) => task.status !== 'completed' && task.dueAt !== null && task.notifiedAt === null && new Date(task.dueAt).getTime() <= now)
}

const initialTasks = readTasks()

export const useTodoStore = create<TodoStore>((set) => ({
  tasks: initialTasks,
  addTask: (input) => {
    const task = createTask(input)
    if (!task) return null
    set((state) => {
      const tasks = [task, ...state.tasks]
      persist(tasks)
      return { tasks }
    })
    return task
  },
  updateTask: (id, input) => set((state) => {
    const tasks = state.tasks.map((task) => {
      if (task.id !== id) return task
      const title = input.title === undefined ? task.title : input.title.trim() || task.title
      const dueAt = input.dueAt === undefined ? task.dueAt : normalizeDueAt(input.dueAt)
      const status = input.status === undefined ? task.status : isStatus(input.status) ? input.status : task.status
      const priority = input.priority === undefined ? task.priority : normalizePriority(input.priority)
      const dueChanged = dueAt !== task.dueAt
      const reopened = task.status === 'completed' && status !== 'completed'
      return {
        ...task,
        title,
        status,
        dueAt,
        priority,
        notes: input.notes === undefined ? task.notes : input.notes,
        updatedAt: new Date().toISOString(),
        notifiedAt: dueChanged || reopened ? null : task.notifiedAt,
      }
    })
    persist(tasks)
    return { tasks }
  }),
  deleteTask: (id) => set((state) => {
    const tasks = state.tasks.filter((task) => task.id !== id)
    persist(tasks)
    return { tasks }
  }),
  markDueNotified: (id) => set((state) => {
    const notifiedAt = new Date().toISOString()
    const tasks = state.tasks.map((task) => task.id === id && task.notifiedAt === null ? { ...task, notifiedAt } : task)
    persist(tasks)
    return { tasks }
  }),
  reset: () => {
    persist([])
    set({ tasks: [] })
  },
}))
