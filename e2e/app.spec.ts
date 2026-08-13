import { expect, test } from '@playwright/test'

test('navigates between the JSON tool, log viewer, and todo tasks', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('JSON Tools')

  await page.getByRole('link', { name: 'Log Viewer' }).click()
  await expect(page.locator('h1')).toHaveText('Log Viewer')
  await expect(page.getByText('导入日志文件后查看请求详情')).toBeVisible()

  await page.getByRole('link', { name: '代办任务' }).click()
  await expect(page.locator('h1')).toHaveText('代办任务')
  await expect(page.getByText('还没有任务')).toBeVisible()
})

test('adds a quick task and switches it to the status board', async ({ page }) => {
  await page.goto('/todos')
  await page.getByRole('textbox', { name: '任务内容' }).fill('确认发布计划')
  await page.getByRole('button', { name: '添加任务' }).click()
  await expect(page.getByText('确认发布计划')).toBeVisible()

  await page.getByRole('button', { name: '看板视图' }).click()
  await expect(page.getByRole('region', { name: '未开始' }).getByText('确认发布计划')).toBeVisible()
})

test('moves a board task into another status column', async ({ page }) => {
  await page.goto('/todos')
  await page.getByRole('textbox', { name: '任务内容' }).fill('拖动任务')
  await page.getByRole('button', { name: '添加任务' }).click()
  await page.getByRole('button', { name: '看板视图' }).click()

  await page.getByRole('article').filter({ hasText: '拖动任务' }).dragTo(page.getByRole('region', { name: '进行中' }))
  await expect(page.getByRole('region', { name: '进行中' }).getByText('拖动任务')).toBeVisible()
})

test('shows an import success toast that closes after three seconds', async ({ page }) => {
  await page.goto('/log-viewer')
  const fileChooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: '导入日志文件' }).click()
  await (await fileChooser).setFiles({
    name: 'requests.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify([{ url: '/api/status', req: {}, res: {} }])),
  })

  const toast = page.getByRole('status')
  await expect(toast).toHaveText('已导入 1 个文件，共 1 条请求')
  await expect(toast).toBeHidden({ timeout: 3500 })
})

test('switches JSON key sorting from the hover icon control', async ({ page }) => {
  await page.goto('/')
  await page.locator('textarea').fill('{"z": 1, "a": 2}')
  await page.getByRole('button', { name: '校验' }).click()
  await expect(page.locator('.json-node .text-json-key')).toHaveText(['a:', 'z:'])

  const sortControl = page.locator('[aria-label="键名排序"]')
  await sortControl.hover()
  await expect(sortControl.getByRole('button', { name: '默认排序' })).toBeVisible()
  await expect(sortControl.getByRole('button', { name: '按键名升序' })).toBeVisible()
  await expect(sortControl.getByRole('button', { name: '按键名降序' })).toBeVisible()
  await expect(sortControl.locator('button[aria-pressed="true"]')).toHaveAccessibleName('按键名升序')

  await sortControl.getByRole('button', { name: '默认排序' }).click()
  await expect(page.locator('.json-node .text-json-key')).toHaveText(['z:', 'a:'])
  await expect(sortControl.locator('button[aria-pressed="true"]')).toHaveAccessibleName('默认排序')

  await sortControl.getByRole('button', { name: '按键名降序' }).click()
  await expect(sortControl.locator('button[aria-pressed="true"]')).toHaveAccessibleName('按键名降序')
})
