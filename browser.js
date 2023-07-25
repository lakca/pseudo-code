const styles = require('./inject.styl')
const inject = require('./inject.js')
const { parse, generate } = require('./parser.js')
const { PSEUDO_CODE, INJECT_FLAG } = require('./def')

const parsers = {}

function pseudoCode(elements, options = {}) {
  if (elements.length) {
    let style = document.head.querySelector(`style[${PSEUDO_CODE}]`)
    if (!style) {
      style = document.createElement('style')
      style.setAttribute(PSEUDO_CODE, 'true')
      document.head.appendChild(style)
    }
    style.innerHTML = styles
  }
  for (const el of elements) {
    const nodes = parse(el.innerText)
    el.innerHTML = generate(nodes)
    const id = Math.random()
    el[PSEUDO_CODE] = id
    el.setAttribute(PSEUDO_CODE, id)
    parsers[id] = nodes
  }
  if (!window[INJECT_FLAG]) {
    inject({ parsers, options })
    window[INJECT_FLAG] = true
  }
}

if (typeof window === 'object') {
  window.pseudoCode = pseudoCode
} else {
  module.exports = pseudoCode
}
