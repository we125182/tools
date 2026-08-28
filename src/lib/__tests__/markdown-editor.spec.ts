import { describe, expect, it } from 'vitest'
import { composeMarkdownDocument, findSlashTrigger, markdownFileName, splitMarkdownDocument } from '../markdown-editor'

describe('findSlashTrigger', () => {
  it('识别段落开头的斜杠命令', () => {
    expect(findSlashTrigger('/head', 12)).toEqual({ from: 7, query: 'head', to: 12 })
  })

  it('识别空格后的斜杠命令', () => {
    expect(findSlashTrigger('文本 /list', 18)).toEqual({ from: 13, query: 'list', to: 18 })
  })

  it('忽略普通路径和包含空格的命令', () => {
    expect(findSlashTrigger('https://example.com/a', 21)).toBeNull()
    expect(findSlashTrigger('/heading one', 12)).toBeNull()
  })
})

describe('markdownFileName', () => {
  it('清理文件名中的保留字符', () => {
    expect(markdownFileName('  发布/计划: v2  ')).toBe('发布-计划- v2.md')
  })

  it('为空标题提供默认文件名', () => {
    expect(markdownFileName('')).toBe('无标题.md')
  })
})

describe('Markdown 文档标题', () => {
  it('复制和导出时把页面标题组合为一级标题', () => {
    expect(composeMarkdownDocument('发布 *计划*', '## 范围\n\n正文')).toBe('# 发布 \\*计划\\*\n\n## 范围\n\n正文')
  })

  it('导入时从首个一级标题恢复页面标题', () => {
    expect(splitMarkdownDocument('# 发布 \\*计划\\*\n\n## 范围\n\n正文', '文件名')).toEqual({
      title: '发布 *计划*',
      body: '## 范围\n\n正文',
    })
  })

  it('没有一级标题时使用文件名作为标题', () => {
    expect(splitMarkdownDocument('普通正文', '说明')).toEqual({ title: '说明', body: '普通正文' })
  })
})
