
// # 基本用法

// 1. 所有的空格、换行都将保留

// # 特殊标记

// 普通文本：
//   - 如果没有任何特殊字符，比如 this is a sentence
//   - 标记（如果有特殊字符，逐个转义比较麻烦，可以用单引号）：''
//   - 示例：'this is a sentence'，'this is a @'sentence containing single quote'
// 注释：
//   - 标记：//
//   - 示例：/this is comments/
// 代码：
//   - 标记：``
//   - 示例：`this is code`
// 普通字符（不解释特殊字符）：
//   - 标记：@
//   - 示例：@`this is not code@`，`this is code @@ containing an at sign`
// 或者：
//   - 标记：|
// 并且：
//   - 标记：&
// 元信息（类似或者和并且，属于自定义的关系符号）：
//   - 标记：""
//   - 示例："*", "+", "?", "(", ")"
// 函数（功能）：
//   - 标记：FUNC_NAME<>
//   - 示例：Exclude<Token, $ | ,>
// 链接：
//   - 标记：[]
//   - 示例：[SomeDefinition]
// 定义：
//   - 标记：#
//   - 示例：#SomeDefinition

const TOKEN = {
  ESCAPE: '@',
  NEWLINE: '\n',
  DEF: '#',
  OR: '|',
  AND: '&',
  RAW: "'",
  RAW_END: "'",
  CODE: '`',
  CODE_END: '`',
  STRONG: '*',
  STRONG_END: '*',
  MARK: '/',
  MARK_END: '/',
  META: '"',
  META_END: '"',
  LINK: '[',
  LINK_END: ']',
  FUNC: '<',
  FUNC_END: '>',
  FUNC_PARAM_SEP: ',',

  SEP: ' \t\n',
}

const NODE = {
  NEWLINE: 'NEWLINE',
  DEF: 'DEF',
  OR: 'OR',
  AND: 'AND',
  RAW: 'RAW',
  RAW_INFER: 'RAW_INFER',
  RAW_END: 'RAW_END',
  CODE: 'CODE',
  CODE_END: 'CODE_END',
  STRONG: 'STRONG',
  STRONG_END: 'STRONG_END',
  MARK: 'MARK',
  MARK_END: 'MARK_END',
  META: 'META',
  META_END: 'META_END',
  LINK: 'LINK',
  LINK_END: 'LINK_END',
  FUNC: 'FUNC',
  FUNC_NAME: 'FUNC_NAME',
  FUNC_LEFT_EDGE: 'FUNC_LEFT_EDGE',
  FUNC_PARAM: 'FUNC_PARAM',
  FUNC_PARAM_END: 'FUNC_PARAM_END',
  FUNC_PARAM_SEP: 'FUNC_PARAM_SEP',
  FUNC_RIGHT_EDGE: 'FUNC_RIGHT_EDGE',
  FUNC_END: 'FUNC_END',
}

const ENTITY_NODE_TOKEN = {
  NEWLINE: true,
  OR: true,
  AND: true,
  RAW_INFER: true,
  FUNC: true,
  FUNC_END: true,
  FUNC_PARAM_SEP: true,
}

const PSEUDO_CODE = '_PSEUDO_CODE_'
const INJECT_FLAG = '_INJECT_PSEUDO_CODE_'

module.exports = {
  TOKEN, NODE, ENTITY_NODE_TOKEN, PSEUDO_CODE, INJECT_FLAG,
}
