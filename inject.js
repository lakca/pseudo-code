const { NODE, PSEUDO_CODE } = require('./def')
const { generate } = require('./parser')

module.exports = function inject({ parsers, options }) {
  const popup = document.createElement('div')
  document.body.appendChild(popup)
  popup.style.position = 'fixed'
  popup.style.display = 'none'
  popup.style.background = '#f6f6f6'
  popup.style.borderRadius = '8px'
  popup.style.boxShadow = '0 0 10px #d6d6d6'

  Object.assign(popup.style, options.popupStyles)

  function showPopup(target, content) {
    const bounding = target.getBoundingClientRect()
    popup.innerHTML = content
    popup.style.display = 'block'
    popup.style.left = bounding.x + bounding.width + 10 + 'px'
    popup.style.top = bounding.y + 'px'
  }
  function hidePopup() {
    popup.style.display = 'none'
  }

  document.body.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains(NODE.LINK) || e.target.classList.contains(NODE.DEF)) {
      for (const el of e.target.closest('.PSEUDO-CODE').querySelectorAll('[href="' + e.target.getAttribute('href') + '"]')) {
        el.classList.add('hover')
      }
      const def = options.local
        ? e.target.closest(`[${PSEUDO_CODE}]`).querySelector(e.target.getAttribute('href'))
        : document.body.querySelector(`[${PSEUDO_CODE}] ${e.target.getAttribute('href')}`)
      if (def) {
        const pseudo = def.closest(`[${PSEUDO_CODE}]`)
        const pseudoId = pseudo[PSEUDO_CODE] || pseudo.getAttribute(PSEUDO_CODE)
        if (parsers[pseudoId]) {
          const nodes = []
          for (const node of parsers[pseudoId]) {
            if (node.t === NODE.DEF && node.s === def.id) {
              nodes.push(node)
            } else if (nodes.length) {
              if (node.t === NODE.DEF) break
              nodes.push(node)
            }
          }
          showPopup(e.target, generate(nodes))
        }
      }
    }
  })
  document.body.addEventListener('mouseout', (e) => {
    if (e.target.classList.contains(NODE.LINK) || e.target.classList.contains(NODE.DEF)) {
      for (const el of e.target.closest('.PSEUDO-CODE').querySelectorAll('[href="' + e.target.getAttribute('href') + '"]')) {
        el.classList.remove('hover')
      }
      hidePopup()
    }
  })
}
