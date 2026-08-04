import { parse, printParseErrorCode, type ParseError } from 'jsonc-parser'
import JSON5 from 'json5'

/** JSON 路径段：对象属性名为 string，数组下标为 number */
export type PathSegment = string | number

export interface JsonError {
  message: string
  line: number
  column: number
  offset: number
}

export interface ValidateResult {
  value: unknown
  errors: JsonError[]
}

const PARSE_OPTIONS = {
  allowTrailingComma: false,
  disallowComments: true,
}

/**
 * 优先按严格 JSON 解析；失败后尝试 JSON5，以支持 JavaScript 对象和数组字面量。
 * JSON5 仅解析数据，不会执行输入中的 JavaScript 代码。
 */
export function validate(text: string): ValidateResult {
  const rawErrors: ParseError[] = []
  const value = parse(text, rawErrors, PARSE_OPTIONS)
  if (rawErrors.length === 0) return { value, errors: [] }

  try {
    return { value: JSON5.parse(text), errors: [] }
  } catch {
    // 保留严格 JSON 的诊断信息，确保错误定位与现有界面保持一致。
  }

  const errors: JsonError[] = rawErrors.map((e) => ({
    ...offsetToLineCol(text, e.offset),
    message: printParseErrorCode(e.error),
    offset: e.offset,
  }))
  return { value, errors }
}

/** 把字符 offset 转成 1-based 的 行:列 */
export function offsetToLineCol(text: string, offset: number): { line: number; column: number } {
  const safeOffset = Math.max(0, Math.min(offset, text.length))
  let line = 1
  let column = 1
  for (let i = 0; i < safeOffset; i++) {
    if (text.charCodeAt(i) === 10) {
      line++
      column = 1
    } else {
      column++
    }
  }
  return { line, column }
}

const IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/

/**
 * 把路径段数组渲染成可读的属性路径字符串。
 * 根节点返回 "$"；合法标识符用 ".foo"；否则用 "['foo']"；数组下标用 "[0]"。
 * 例：['user','address','city'] => "$.user.address.city"
 *     ['users', 2, 'my-key']    => "$.users[2]['my-key']"
 */
export function pathKey(segments: PathSegment[]): string {
  let out = '$'
  for (const seg of segments) {
    if (typeof seg === 'number') {
      out += `[${seg}]`
    } else if (IDENT_RE.test(seg)) {
      out += `.${seg}`
    } else {
      out += `['${seg.replace(/'/g, "\\'")}']`
    }
  }
  return out
}

/** 把值格式化为规范 JSON 文本 */
export function beautify(value: unknown, indent: number): string {
  return JSON.stringify(value, null, indent)
}

export type JsonValueType =
  | 'object'
  | 'array'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'

export function typeOf(value: unknown): JsonValueType {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value as JsonValueType
}

export function isContainer(value: unknown): boolean {
  return typeOf(value) === 'object' || typeOf(value) === 'array'
}

/** 折叠时的摘要文本：…3 keys / …5 items */
export function summary(value: unknown): string {
  if (Array.isArray(value)) {
    const n = value.length
    return `…${n} ${n === 1 ? 'item' : 'items'}`
  }
  if (value && typeof value === 'object') {
    const n = Object.keys(value).length
    return `…${n} ${n === 1 ? 'key' : 'keys'}`
  }
  return ''
}

/** 粗略估算节点数量，用于性能阈值判断 */
export function estimateNodeCount(value: unknown): number {
  let count = 0
  const stack: unknown[] = [value]
  while (stack.length) {
    const node = stack.pop()
    count++
    if (Array.isArray(node)) {
      for (const item of node) stack.push(item)
    } else if (node && typeof node === 'object') {
      for (const item of Object.values(node)) stack.push(item)
    }
  }
  return count
}
