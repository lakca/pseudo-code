const styles = require('./inject.styl')
const inject = require('./inject.js')
const { parse, generate } = require('./parser.js')
const { PSEUDO_CODE, INJECT_FLAG, pseudonymize } = require('./def')

const parsers = {}

function pseudoCode(elements, options = {}) {
  if (elements.length) {
    let style = document.head.querySelector(`style[${PSEUDO_CODE}]`)
    if (!style) {
      style = pseudonymize(document.createElement('style'))
      document.head.appendChild(style)
    }
    style.innerHTML = styles
  }
  for (const el of elements) {
    const nodes = parse(el.textContent)
    const html = generate(nodes)
    pseudonymize(el)
    parsers[el[PSEUDO_CODE]] = nodes
    el.innerHTML = html
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
