const styles = require('./inject.styl')
const inject = require('./inject.js')
const { parse, generate } = require('./index')

function pseudoCode(elements) {
  if (elements.length) {
    let style = document.head.querySelector('style[bound-for="PSEUDO-CODE"]')
    if (!style) {
      style = document.createElement('style')
      document.head.appendChild(style)
    }
    style.innerHTML = styles
  }
  for (const el of elements) {
    el.innerHTML = generate(parse(el.innerText))
  }
  if (!window._INJECT_PSEUDO_CODE_) {
    inject()
    window._INJECT_PSEUDO_CODE_ = true
  }
}

if (typeof window === 'object') {
  window.pseudoCode = pseudoCode
} else {
  module.exports = pseudoCode
}
