import { describe, it, expect } from 'vitest'
import {
  validate,
  offsetToLineCol,
  pathKey,
  beautify,
  typeOf,
  isContainer,
  summary,
  estimateNodeCount,
} from '../jsonc'

describe('validate', () => {
  it('合法 JSON 返回值且无错误', () => {
    const { value, errors } = validate('{"a":1,"b":[2,3]}')
    expect(errors).toHaveLength(0)
    expect(value).toEqual({ a: 1, b: [2, 3] })
  })

  it('非法 JSON（缺逗号）记录错误', () => {
    const { errors } = validate('{"a":1 "b":2}')
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]?.message).toBeTruthy()
  })

  it('支持带注释和尾随逗号的 JavaScript 对象', () => {
    const { value, errors } = validate("{ name: 'Codex', // 名称\n items: [1, 2,], }")
    expect(errors).toHaveLength(0)
    expect(value).toEqual({ name: 'Codex', items: [1, 2] })
  })

  it('支持 JavaScript 数组字面量', () => {
    const { value, errors } = validate("[{ id: 1, title: 'JSON Tools' }, true]")
    expect(errors).toHaveLength(0)
    expect(value).toEqual([{ id: 1, title: 'JSON Tools' }, true])
  })

  it('空对象合法', () => {
    const { value, errors } = validate('{}')
    expect(errors).toHaveLength(0)
    expect(value).toEqual({})
  })
})

describe('offsetToLineCol', () => {
  it('首字符为 1:1', () => {
    expect(offsetToLineCol('abc', 0)).toEqual({ line: 1, column: 1 })
  })
  it('第二行为 line 2', () => {
    const text = 'first\nsecond'
    // 'second' 的 's' 偏移为 6
    expect(offsetToLineCol(text, 6)).toEqual({ line: 2, column: 1 })
  })
})

describe('pathKey', () => {
  it('根节点为 $', () => {
    expect(pathKey([])).toBe('$')
  })
  it('合法标识符用点号', () => {
    expect(pathKey(['user', 'address', 'city'])).toBe('$.user.address.city')
  })
  it('数组下标用方括号', () => {
    expect(pathKey(['users', 2, 'name'])).toBe('$.users[2].name')
  })
  it('特殊字符用括号表示法并转义单引号', () => {
    expect(pathKey(['my-key'])).toBe("$['my-key']")
    expect(pathKey(["it's"])).toBe("$['it\\'s']")
  })
})

describe('beautify', () => {
  it('按指定缩进格式化', () => {
    expect(beautify({ a: 1 }, 2)).toBe('{\n  "a": 1\n}')
    expect(beautify({ a: 1 }, 4)).toBe('{\n    "a": 1\n}')
  })
})

describe('typeOf / isContainer / summary / estimateNodeCount', () => {
  it('typeOf 推导各类型', () => {
    expect(typeOf(null)).toBe('null')
    expect(typeOf([])).toBe('array')
    expect(typeOf({})).toBe('object')
    expect(typeOf('s')).toBe('string')
    expect(typeOf(1)).toBe('number')
    expect(typeOf(true)).toBe('boolean')
  })
  it('isContainer 仅对 object/array 为真', () => {
    expect(isContainer({})).toBe(true)
    expect(isContainer([])).toBe(true)
    expect(isContainer(null)).toBe(false)
    expect(isContainer('x')).toBe(false)
  })
  it('summary 文本正确', () => {
    expect(summary({ a: 1, b: 2, c: 3 })).toBe('{ …3 keys }')
    expect(summary([1, 2, 3, 4, 5])).toBe('[ …5 items ]')
    expect(summary([])).toBe('[]')
    expect(summary({})).toBe('{}')
  })
  it('estimateNodeCount 统计所有节点', () => {
    // { a: [1, 2] } => object(1) + array(1) + 1(1) + 2(1) = 4
    expect(estimateNodeCount({ a: [1, 2] })).toBe(4)
    expect(estimateNodeCount(null)).toBe(1)
  })
})
