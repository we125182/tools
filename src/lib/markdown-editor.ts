export type SlashTrigger = {
  from: number
  query: string
  to: number
}

export function findSlashTrigger(textBeforeCursor: string, cursorPosition: number): SlashTrigger | null {
  const match = textBeforeCursor.match(/(?:^|\s)\/([^/\s]*)$/)
  if (!match) return null

  const query = match[1] ?? ''
  return {
    from: cursorPosition - query.length - 1,
    query,
    to: cursorPosition,
  }
}

export function markdownFileName(title: string) {
  const safeTitle = title
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\.+$/g, '')

  return `${safeTitle || '无标题'}.md`
}

function escapeMarkdownTitle(title: string) {
  return title.replace(/([\\`*_[\]{}()#+.!|>])/g, '\\$1')
}

function unescapeMarkdownTitle(title: string) {
  return title.replace(/\\([\\`*_[\]{}()#+.!|>])/g, '$1')
}

export function composeMarkdownDocument(title: string, body: string) {
  const cleanTitle = title.trim()
  const cleanBody = body.trimStart()
  if (!cleanTitle) return cleanBody
  if (!cleanBody) return `# ${escapeMarkdownTitle(cleanTitle)}`
  return `# ${escapeMarkdownTitle(cleanTitle)}\n\n${cleanBody}`
}

export function splitMarkdownDocument(markdown: string, fallbackTitle: string) {
  const normalized = markdown.replace(/^\uFEFF/, '')
  const heading = normalized.match(/^#\s+(.+?)(?:\r?\n|$)/)
  if (!heading) return { title: fallbackTitle, body: normalized }

  const title = unescapeMarkdownTitle(heading[1] ?? '').trim() || fallbackTitle
  const body = normalized.slice(heading[0].length).replace(/^\r?\n/, '')
  return { title, body }
}
