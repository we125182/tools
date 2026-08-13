import { beforeEach, describe, expect, it } from 'vitest'
import { getDueTasks, useTodoStore } from '../todos'

describe('todo Zustand store', () => {
  beforeEach(() => {
    localStorage.clear()
    useTodoStore.getState().reset()
  })

  it('creates a quick task with default details', () => {
    const task = useTodoStore.getState().addTask({ title: '整理接口文档' })

    expect(task).toMatchObject({
      title: '整理接口文档',
      status: 'not-started',
      dueAt: null,
      priority: 'normal',
      notes: '',
    })
    expect(useTodoStore.getState().tasks).toHaveLength(1)
  })

  it('persists detail fields and resets a reminder when task is reopened', () => {
    const task = useTodoStore.getState().addTask({
      title: '发布版本',
      status: 'in-progress',
      dueAt: '2026-08-13T10:00',
      priority: 'urgent',
      notes: '确认变更记录',
    })!
    useTodoStore.getState().markDueNotified(task.id)
    useTodoStore.getState().updateTask(task.id, { status: 'completed' })
    useTodoStore.getState().updateTask(task.id, { status: 'in-progress' })

    expect(useTodoStore.getState().tasks[0]).toMatchObject({
      status: 'in-progress',
      priority: 'urgent',
      notes: '确认变更记录',
      notifiedAt: null,
    })
  })

  it('finds only unfinished, unnotified tasks past their deadline', () => {
    const overdue = useTodoStore.getState().addTask({ title: '已到期', dueAt: '2026-08-13T09:00' })!
    const completed = useTodoStore.getState().addTask({ title: '已完成', dueAt: '2026-08-13T09:00', status: 'completed' })!
    const future = useTodoStore.getState().addTask({ title: '未到期', dueAt: '2026-08-13T11:00' })!
    useTodoStore.getState().markDueNotified(future.id)

    expect(getDueTasks(useTodoStore.getState().tasks, new Date('2026-08-13T10:00').getTime()).map((task) => task.id)).toEqual([overdue.id])
    expect(completed.id).toBeTruthy()
  })

  it('migrates legacy priority values to normal or urgent', () => {
    const normal = useTodoStore.getState().addTask({ title: '普通任务', priority: 'low' as never })
    const urgent = useTodoStore.getState().addTask({ title: '紧急任务', priority: 'high' as never })

    expect(normal?.priority).toBe('normal')
    expect(urgent?.priority).toBe('urgent')
  })
})
