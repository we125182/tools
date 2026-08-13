export type NotificationPermissionResult = 'granted' | 'denied' | 'unsupported'

export async function requestTaskNotificationPermission(): Promise<NotificationPermissionResult> {
  if (window.electronAPI?.showNotification) return 'granted'
  if (!('Notification' in window)) return 'unsupported'
  if (window.Notification.permission === 'granted') return 'granted'
  return (await window.Notification.requestPermission()) === 'granted' ? 'granted' : 'denied'
}

export async function notifyTaskDue(title: string): Promise<void> {
  const body = `任务“${title}”已到截止时间。`
  if (window.electronAPI?.showNotification) {
    await window.electronAPI.showNotification('任务到期提醒', body)
    return
  }
  if ('Notification' in window && window.Notification.permission === 'granted') {
    new window.Notification('任务到期提醒', { body })
  }
}
