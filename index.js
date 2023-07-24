// let s = ''
// process.stdin.setEncoding('utf-8').on('data', b => s += b).on('end', () => {
//   require('fs').writeFileSync(__filename.replace('.js', '.json'), JSON.stringify(parse(s), null, 2))
//   console.log(render(parse(s)))
// })
const styles = require('./inject.styl')
const inject = require('./inject.js')
const { parse, generate } = require('./parse')

window.pseudoCode = function(elements) {
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
