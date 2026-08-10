import { expect, test } from '@playwright/test'

test('navigates between the JSON tool and the log viewer', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('JSON Tools')

  await page.getByRole('link', { name: 'Log Viewer' }).click()
  await expect(page.locator('h1')).toHaveText('Log Viewer')
  await expect(page.getByText('导入日志文件后查看请求详情')).toBeVisible()
})
