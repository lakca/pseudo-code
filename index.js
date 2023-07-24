const { NODE, TOKEN, SEQ } = require('./def')

module.exports = { parse, generate }

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
  let nodes = []
  /** @type {LexerNode} */
  let last_node = null
  /** @type {LexerNode} */
  let node = null
  const LENGTH = s.length
  // token
  function read() {
    token_cache += token
    token = s[++index]
    return { index, token }
  }
  function got(i) {
    return token_cache[token_cache.length + i]
  }
  function flush() {
    token_cache = ''
  }
  // node
  function next(type) {
    last_node = node || last_node
    node = { s: '', t: type, v: last_node ? last_node.v : 0 }
    nodes.push(node)
    return node
  }
  function down(type) {
    last_node = node || last_node
    node = { s: '', t: type, v: last_node.v + 1 }
    nodes.push(node)
    return node
  }
  function end(type) {
    if (type) {
      next(type)
    }
    last_node = node || last_node
    node = null
  }
  function back() {
    last_node = node || last_node
    node = nodes[nodes.indexOf(last_node) - 1]
    return node
  }
  function up() {
    last_node = node || last_node
    let i = nodes.indexOf(last_node)
    while (true) {
      if (nodes[i].v < last_node.v) {
        node = nodes[i]
        return node
      }
    }
  }
  function eat(t) {
    if (!node) next(NODE.RAW)
    node.s += t
  }
  // read
  function readDef() {
    next(NODE.DEF)
    while (read().index < LENGTH) {
      if (tryRaw()) continue
      if (TOKEN.SEP.indexOf(token) > -1) {
        if (tryNewline()) continue
        next(NODE.RAW)
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
        if (got(-1) === TOKEN.ESCAPE) {
          eat(token)
        } else {
          end()
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
        if (got(-1) === TOKEN.ESCAPE) {
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
        if (got(-1) === TOKEN.ESCAPE) {
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
  function readCode() {
    next(NODE.CODE)
    while (read().index < LENGTH) {
      if (token === TOKEN.CODE_END) {
        if (got(-1) === TOKEN.ESCAPE) {
          eat(token)
        } else {
          end(NODE.CODE_END)
          return true
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
        if (got(-1) === TOKEN.ESCAPE) {
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
    if (!node || node.t !== NODE.RAW) return
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
      if (token === TOKEN.FUNC_PARAM_SEP && got(-1) !== TOKEN.ESCAPE) {
        next(NODE.FUNC_PARAM_END)
        next(NODE.FUNC_PARAM_SEP)
        eat(token)
        next(NODE.FUNC_PARAM)
        end()
        continue
      }
      if (token === TOKEN.FUNC_END) {
        if (got(-1) === TOKEN.ESCAPE) {
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
    while (read().index < LENGTH) {
      if (tryNewline() || tryCode()) {
        continue
      }
      if (token === TOKEN.MARK_END) {
        if (got(-1) === TOKEN.ESCAPE) {
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
      if (got(-1) !== TOKEN.ESCAPE) {
        next(NODE.OR)
        eat(token)
        end()
        return true
      }
    }
  }
  function tryAnd() {
    if (token === TOKEN.AND) {
      if (got(-1) !== TOKEN.ESCAPE) {
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
      flush()
      return true
    }
  }
  function tryRaw() {
    if (token === TOKEN.RAW) {
      if (got(-1) !== TOKEN.ESCAPE) {
        return readRaw()
      }
    }
  }
  function tryDef() {
    if (token === TOKEN.DEF) {
      const last = nodes[nodes.length - 2]
      if (!node || node.t === NODE.NEWLINE || !last || (last.t === NODE.NEWLINE && node.s.trim() === '')) {
        if (got(-1) !== TOKEN.ESCAPE) {
          return readDef()
        }
      }
    }
  }
  function tryLink() {
    if (token === TOKEN.LINK) {
      if (got(-1) !== TOKEN.ESCAPE) {
        return readLink()
      }
    }
  }
  function tryMeta() {
    if (token === TOKEN.META) {
      if (got(-1) !== TOKEN.ESCAPE) {
        return readMeta()
      }
    }
  }
  function tryCode() {
    if (token === TOKEN.CODE) {
      if (got(-1) !== TOKEN.ESCAPE) {
        return readCode()
      }
    }
  }
  function tryStrong() {
    if (token === TOKEN.STRONG) {
      if (got(-1) !== TOKEN.ESCAPE) {
        return readStrong()
      }
    }
  }
  function tryFunc() {
    if (token === TOKEN.FUNC) {
      if (got(-1) !== TOKEN.ESCAPE) {
        return readFunc()
      }
    }
  }
  function tryMark() {
    if (token === TOKEN.MARK) {
      if (got(-1) !== TOKEN.ESCAPE) {
        return readMark()
      }
    }
  }
  try {
    while (read().index < LENGTH) {
      if (token === TOKEN.RAW) {
        tryRaw()
      } else if (token === TOKEN.NEWLINE) {
        tryNewline()
      } else if (token === TOKEN.DEF) {
        tryDef()
      } else if (token === TOKEN.OR) {
        tryOr()
      } else if (token === TOKEN.AND) {
        tryAnd()
      } else if (token === TOKEN.CODE) {
        tryCode()
      } else if (token === TOKEN.STRONG) {
        tryStrong()
      } else if (token === TOKEN.META) {
        tryMeta()
      } else if (token === TOKEN.MARK) {
        tryMark()
      } else if (token === TOKEN.LINK) {
        tryLink()
      } else if (token === TOKEN.FUNC) {
        tryFunc()
      } else {
        eat(token)
      }
    }
  } catch (e) { console.log(JSON.stringify(nodes, null, 2)); throw e }
  return nodes
}

function generate(nodes) {
  return `<pre class="PSEUDO-CODE">` + nodes.reduce((v, e) => {
    if (e.t === NODE.NEWLINE) {
      return v + '<br/>'
    } else if (e.t === NODE.LINK) {
      return v + `<a class="${e.t}" href="#${e.s}">${e.s}`
    } else if (e.t === NODE.LINK_END) {
      return v + `</a>`
    } else if (e.t === NODE.DEF) {
      return v + `<a class="${e.t}" href="#${e.s}" id="${e.s}">${e.s}</a>`
    }
    if (e.t.endsWith('_END')) {
      return v + '</span>'
    }
    if (NODE[e.t + '_END']) {
      return v + `<span class="${e.t}">${e.s}`
    } else {
      return v + `<span class="${e.t}">${e.s}</span>`
    }
  }, '') + `</pre>`
}
