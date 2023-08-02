const { NODE, TOKEN, ENTITY_NODE_TOKEN } = require('./def')

/**
 * @typedef LexerNode
 * @property {string} s
 * @property {NODE[keyof NODE]} t
 * @property {number} v
 */

function parse(s) {
  let index = -1
  let token = ''
  let token_cache = ''
  /** @type {LexerNode[]} */
  const nodes = []
  /** @type {LexerNode} */
  let last_node = null
  /** @type {LexerNode} */
  let node = null
  let escapes = 0
  let spaces = 0
  const LENGTH = s.length
  // token
  function read() {
    token_cache += token
    token = s[++index]
    return { index, token }
  }
  function shadowRead() {
    let i = index
    return function read() {
      return s[++i]
    }
  }
  function skip(n) {
    while (n--) read()
  }
  function repeated(t) {
    let n = 1
    const read = shadowRead()
    while (read() === t) n++
    return n
  }
  function got(i) {
    return token_cache[token_cache.length + i]
  }
  function flushCache() {
    token_cache = ''
  }
  // node
  function next(type) {
    last_node = node || last_node
    node = { s: '', t: type, v: last_node ? last_node.v : 0 }
    nodes.push(node)
    return node
  }
  // function down(type) {
  //   last_node = node || last_node
  //   node = { s: '', t: type, v: last_node.v + 1 }
  //   nodes.push(node)
  //   return node
  // }
  // function back() {
  //   last_node = node || last_node
  //   node = nodes[nodes.indexOf(last_node) - 1]
  //   return node
  // }
  // function up() {
  //   last_node = node || last_node
  //   let i = nodes.indexOf(last_node)
  //   while (true) {
  //     if (nodes[i].v < last_node.v) {
  //       node = nodes[i]
  //       return node
  //     }
  //   }
  // }
  function end(type) {
    flush()
    if (type) next(type)
    last_node = node || last_node
    node = null
  }
  function eat(t) {
    if (!node) next(NODE.RAW_INFER)
    if (t === TOKEN.ESCAPE) {
      escapes += 1
    } else {
      flush()
      node.s += t
    }
  }
  function flush() {
    if (escapes > 0) {
      node.s = TOKEN.ESCAPE.repeat(escapes)
      escapes = 0
    }
  }
  function eatEscape() {
    if (!node) next(NODE.RAW_INFER)
    spaces += Math.floor(escapes / 2)
    if (escapes % 2 === 0) {
      node.s += TOKEN.ESCAPE.repeat(escapes / 2)
      escapes = 0
      return false
    } else {
      node.s += TOKEN.ESCAPE.repeat(Math.floor(escapes / 2))
      escapes = 0
      return true
    }
  }
  function eatSpace() {
    for (let i = nodes.length; i--;) {
      if (nodes[i].t === NODE.NEWLINE || nodes[i].s.indexOf('\n') > -1) {
        break
      } else {
        if (!ENTITY_NODE_TOKEN[nodes[i].t]) {
          spaces += 1
        }
      }
    }
    node.s += '&nbsp'.repeat(spaces)
    node._ = spaces
    spaces = 0
  }
  // read
  function readDef() {
    next(NODE.DEF)
    while (read().index < LENGTH) {
      if (tryRaw()) continue
      if (TOKEN.SEP.indexOf(token) > -1) {
        if (tryNewline()) continue
        end()
        eat(token)
        return true
      } else {
        eat(token)
      }
    }
    return true
  }
  function readRaw() {
    next(NODE.RAW)
    while (read().index < LENGTH) {
      if (tryNewline()) continue
      if (token === TOKEN.RAW_END) {
        if (eatEscape()) {
          eat(token)
        } else {
          end(NODE.RAW_END)
          return true
        }
      } else {
        eat(token)
      }
    }
    return true
  }
  function readLink() {
    next(NODE.LINK)
    while (read().index < LENGTH) {
      if (tryRaw() || tryCode()) {
        continue
      }
      if (token === TOKEN.LINK_END) {
        if (eatEscape()) {
          eat(token)
        } else {
          end(NODE.LINK_END)
          return true
        }
      } else {
        eat(token)
      }
    }
    return true
  }
  function readMeta() {
    next(NODE.META)
    while (read().index < LENGTH) {
      if (tryRaw() || tryLink() || tryCode() || tryOr() || tryAnd()) {
        continue
      }
      if (token === TOKEN.META_END) {
        if (eatEscape()) {
          eat(token)
        } else {
          end(NODE.META_END)
          return true
        }
      } else {
        eat(token)
      }
    }
    return true
  }
  function readCode(n) {
    next(NODE.CODE)
    while (read().index < LENGTH) {
      if (token === TOKEN.CODE_END) {
        if (repeated(TOKEN.CODE_END) >= n) {
          skip(n - 1)
          end(NODE.CODE_END)
          return true
        } else {
          eat(token)
        }
      } else {
        eat(token)
      }
    }
    return true
  }
  function readStrong() {
    next(NODE.STRONG)
    while (read().index < LENGTH) {
      if (token === TOKEN.STRONG_END) {
        if (eatEscape()) {
          eat(token)
        } else {
          end(NODE.STRONG_END)
          return true
        }
      } else {
        eat(token)
      }
    }
    return true
  }
  function readFunc() {
    if (!node || (node.t !== NODE.RAW && node.t !== NODE.RAW_INFER)) return
    const match = node.s.match(/^(.*?)(\S+)$/)
    if (!match) return
    node.s = match[1]
    next(NODE.FUNC)
    next(NODE.FUNC_NAME)
    eat(match[2])
    next(NODE.FUNC_LEFT_EDGE)
    eat(token)
    next(NODE.FUNC_PARAM)
    while (read().index < LENGTH) {
      if (tryCode() || tryLink() || tryMeta() || tryOr() || tryAnd() || tryRaw()) {
        continue
      }
      if (token === TOKEN.FUNC_PARAM_SEP && !eatEscape()) {
        next(NODE.FUNC_PARAM_END)
        next(NODE.FUNC_PARAM_SEP)
        eat(token)
        next(NODE.FUNC_PARAM)
        end()
        continue
      }
      if (token === TOKEN.FUNC_END) {
        if (eatEscape()) {
          eat(token)
        } else {
          end(NODE.FUNC_PARAM_END)
          end(NODE.FUNC_RIGHT_EDGE)
          eat(token)
          end(NODE.FUNC_END)
          return true
        }
      } else {
        eat(token)
      }
    }
    return true
  }
  function readMark() {
    next(NODE.MARK)
    eatSpace()
    while (read().index < LENGTH) {
      if (tryNewline() || tryCode() || tryStrong() || tryLink()) {
        continue
      }
      if (token === TOKEN.MARK_END) {
        if (eatEscape()) {
          eat(token)
        } else {
          end(NODE.MARK_END)
          return true
        }
      } else {
        eat(token)
      }
    }
    return true
  }
  // try: check in and read
  function tryOr() {
    if (token === TOKEN.OR) {
      if (!eatEscape()) {
        next(NODE.OR)
        eat(token)
        end()
        return true
      }
    }
  }
  function tryAnd() {
    if (token === TOKEN.AND) {
      if (!eatEscape()) {
        next(NODE.AND)
        eat(token)
        end()
        return true
      }
    }
  }
  function tryNewline() {
    if (token === TOKEN.NEWLINE) {
      next(NODE.NEWLINE)
      end()
      flushCache()
      return true
    }
  }
  function tryRaw() {
    if (token === TOKEN.RAW) {
      if (!eatEscape()) {
        return readRaw()
      }
    }
  }
  function tryDef() {
    if (token === TOKEN.DEF) {
      const last = nodes[nodes.length - 2]
      if (!node || node.t === NODE.NEWLINE || !last || (last.t === NODE.NEWLINE && node.s.trim() === '')) {
        if (!eatEscape()) {
          return readDef()
        }
      }
    }
  }
  function tryLink() {
    if (token === TOKEN.LINK) {
      if (!eatEscape()) {
        return readLink()
      }
    }
  }
  function tryMeta() {
    if (token === TOKEN.META) {
      if (!eatEscape()) {
        return readMeta()
      }
    }
  }
  function tryCode() {
    if (token === TOKEN.CODE) {
      const n = repeated(TOKEN.CODE)
      skip(n - 1)
      if (!eatEscape()) {
        return readCode(n)
      }
    }
  }
  function tryStrong() {
    if (token === TOKEN.STRONG) {
      if (!eatEscape()) {
        return readStrong()
      }
    }
  }
  function tryFunc() {
    if (token === TOKEN.FUNC) {
      if (!eatEscape()) {
        return readFunc()
      }
    }
  }
  function tryMark() {
    if (token === TOKEN.MARK) {
      if (!eatEscape()) {
        return readMark()
      }
    }
  }
  while (read().index < LENGTH) {
    if (token === TOKEN.RAW) {
      if (tryRaw()) continue
    } else if (token === TOKEN.NEWLINE) {
      if (tryNewline()) continue
    } else if (token === TOKEN.DEF) {
      if (tryDef()) continue
    } else if (token === TOKEN.OR) {
      if (tryOr()) continue
    } else if (token === TOKEN.AND) {
      if (tryAnd()) continue
    } else if (token === TOKEN.CODE) {
      if (tryCode()) continue
    } else if (token === TOKEN.STRONG) {
      if (tryStrong()) continue
    } else if (token === TOKEN.META) {
      if (tryMeta()) continue
    } else if (token === TOKEN.MARK) {
      if (tryMark()) continue
    } else if (token === TOKEN.LINK) {
      if (tryLink()) continue
    } else if (token === TOKEN.FUNC) {
      if (tryFunc()) continue
    }
    eat(token)
  }
  return nodes
}

function generate(nodes) {
  console.log(nodes)
  return nodes.reduce((markup, node) => {
    if (node.t === NODE.NEWLINE) {
      return markup + '<br/>'
    } else if (node.t === NODE.LINK) {
      return markup + `<a class="${node.t}" href="#${node.s}">${node.s}`
    } else if (node.t === NODE.LINK_END) {
      return markup + '</a>'
    } else if (node.t === NODE.DEF) {
      return markup + `<a class="${node.t}" href="#${node.s}" id="${node.s}">${node.s}</a>`
    } else if (node.t === NODE.MARK) {
      return markup + `<span class="${node.t}" spaces=${node._}>${node.s}`
    }
    if (node.t.endsWith('_END')) {
      return markup + '</span>'
    }
    if (NODE[node.t + '_END']) {
      return markup + `<span class="${node.t}">${node.s}`
    } else {
      return markup + `<span class="${node.t}">${node.s}</span>`
    }
  }, '')
}

module.exports = { parse, generate }
