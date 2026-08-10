import { expect, test } from '@playwright/test'

test('navigates between the JSON tool and the log viewer', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('JSON Tools')

  await page.getByRole('link', { name: 'Log Viewer' }).click()
  await expect(page.locator('h1')).toHaveText('Log Viewer')
  await expect(page.getByText('导入日志文件后查看请求详情')).toBeVisible()
})

test('switches JSON key sorting from the hover icon control', async ({ page }) => {
  await page.goto('/')
  await page.locator('textarea').fill('{"z": 1, "a": 2}')
  await page.getByRole('button', { name: '校验' }).click()

  const sortControl = page.locator('[aria-label="键名排序"]')
  await sortControl.hover()
  await expect(sortControl.getByRole('button', { name: '默认排序' })).toBeVisible()
  await expect(sortControl.getByRole('button', { name: '按键名升序' })).toBeVisible()
  await expect(sortControl.getByRole('button', { name: '按键名降序' })).toBeVisible()

  await sortControl.getByRole('button', { name: '按键名降序' }).click()
  await expect(sortControl.locator('button[aria-pressed="true"]')).toHaveAccessibleName('按键名降序')
})
