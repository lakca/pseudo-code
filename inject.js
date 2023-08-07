const { NODE, PSEUDO_CODE, pseudonymize } = require('./def')
const { generate } = require('./parser')

module.exports = function inject({ parsers, options }) {
  const popup = pseudonymize(document.createElement('pre'))
  document.body.appendChild(popup)
  popup.style.position = 'fixed'
  popup.style.display = 'none'
  popup.style.background = '#f6f6f6'
  popup.style.borderRadius = '8px'
  popup.style.boxShadow = '0 0 10px #d6d6d6'
  popup.style.padding = '4px 8px'

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

  /**
   * @param {*} self
   * @param {(pseudo: Element, self: Element, is: (type: NODE[keyof NODE], target?: Element) => boolean) => void} cb
   */
  function innerPseudo(self, cb) {
    if (self && self instanceof Element) {
      const pseudo = self.closest(`[${PSEUDO_CODE}]`)
      if (pseudo) {
        pseudo[PSEUDO_CODE] = pseudo.getAttribute(PSEUDO_CODE)
        cb(pseudo, self, function is(type, target) {
          return (target || self).classList.contains(type)
        })
      }
    }
  }

  document.body.addEventListener('mouseover', (e) => {
    if (!(e.target && e.target instanceof Element)) return
    innerPseudo(e.target, (root, self, is) => {
      const href = self.getAttribute('href')
      if (href && is(NODE.LINK) || is(NODE.DEF)) {
        for (const el of root.querySelectorAll(`[href="${href}"]`)) {
          el.classList.add('hover')
        }
        if (href && is(NODE.LINK)) {
          innerPseudo(options.local ? root.querySelector(href) : document.body.querySelector(`[${PSEUDO_CODE}] ${href}`), (root, self) => {
            if (parsers[root[PSEUDO_CODE]]) {
              const nodes = []
              for (const node of parsers[root[PSEUDO_CODE]]) {
                if (node.t === NODE.DEF && node.s === self.id) {
                  nodes.push(node)
                } else if (nodes.length) {
                  if (node.t === NODE.DEF) break
                  nodes.push(node)
                }
              }
              // remove trailing empty lines
              for (let i = nodes.length; i--;) {
                if (nodes[i].t === NODE.NEWLINE || (nodes[i].t === NODE.RAW_INFER && !nodes[i].s.trim())) {
                  nodes.length -= 1
                } else {
                  break
                }
              }
              showPopup(e.target, generate(nodes))
            }
          })
        }
      }
    })
  })
  document.body.addEventListener('mouseout', (e) => {
    if (!(e.target && e.target instanceof Element)) return
    const pseudoRoot = e.target.closest(`[${PSEUDO_CODE}]`)
    const isLink = e.target.classList.contains(NODE.LINK)
    const isDef = e.target.classList.contains(NODE.DEF)
    if (pseudoRoot && (isLink || isDef)) {
      for (const el of pseudoRoot.querySelectorAll('[href="' + e.target.getAttribute('href') + '"]')) {
        el.classList.remove('hover')
      }
      hidePopup()
    }
  })
}
