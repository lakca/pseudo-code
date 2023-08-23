const { NODE, PSEUDO_CODE, pseudonymize, getPseudoId, getPseudo, PSEUDO_TARGET, PSEUDO } = require('./def')
const { generate } = require('./parser')

module.exports = function inject({ parsers, options }) {
  let HIDE_POPUP_TIMEOUT = null
  const popup = pseudonymize(document.createElement('pre'))
  popup.setAttribute(PSEUDO, 'popup')
  document.body.appendChild(popup)
  popup.style.position = 'fixed'
  popup.style.display = 'none'
  popup.style.background = '#f6f6f6'
  popup.style.borderRadius = '8px'
  popup.style.boxShadow = '0 0 10px #d6d6d6'
  popup.style.padding = '4px 8px'

  Object.assign(popup.style, options.popupStyles)

  function showPopup(pseudo, target, content) {
    clearTimeout(HIDE_POPUP_TIMEOUT)
    const bounding = target.getBoundingClientRect()
    popup.setAttribute(PSEUDO_TARGET, getPseudoId(pseudo))
    popup.innerHTML = content
    popup.style.display = 'block'
    popup.style.left = bounding.x + bounding.width / 2 + 'px'
    popup.style.top = bounding.y + 10 + 'px'
  }
  function hidePopup() {
    popup.style.display = 'none'
  }
  function isPopup(pseudo) {
    return pseudo.getAttribute(PSEUDO) === 'popup'
  }

  function is(target, type) {
    return target.getAttribute(PSEUDO) === type
  }

  function toggleHoverRelated(pseudo, href, force) {
    for (const el of pseudo.querySelectorAll(`[href="${href}"]`)) {
      force ? el.classList.add('hover') : el.classList.remove('hover')
    }
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
        cb(pseudo, self, is.bind(null, self))
      }
    }
  }

  document.body.addEventListener('mouseover', (e) => {
    if (!(e.target && e.target instanceof Element)) return
    innerPseudo(e.target, (pseudo, self, is) => {
      const href = self.getAttribute('href')
      if (href && is(NODE.LINK) || is(NODE.DEF)) {
        toggleHoverRelated(pseudo, href, true)
        if (isPopup(pseudo)) {
          toggleHoverRelated(getPseudo(pseudo.getAttribute(PSEUDO_TARGET)), href, true)
        } else {
          if (href && is(NODE.LINK)) {
            innerPseudo(options.local ? pseudo.querySelector(href) : document.body.querySelector(`[${PSEUDO_CODE}] ${href}`), (pseudo, def) => {
              const tree = parsers[getPseudoId(pseudo)]
              if (tree) {
                const nodes = []
                tree.some((node, i) => {
                  if (node.t === NODE.DEF && node.s === def.id) {
                    nodes.push(node)
                  } else if (nodes.length) {
                    if (node.t === NODE.DEF) return true
                    nodes.push(node)
                  } return false
                })
                while (true) {
                  if (nodes.pop().t === NODE.NEWLINE) break
                }
                if (nodes.length) {
                  showPopup(pseudo, e.target, generate(nodes))
                }
              }
            })
          }
        }
      }
    })
  })
  document.body.addEventListener('mouseout', (e) => {
    if (!(e.target && e.target instanceof Element)) return
    const pseudo = e.target.closest(`[${PSEUDO_CODE}]`)
    const isLink = is(e.target, NODE.LINK)
    const isDef = is(e.target, NODE.DEF)
    if (pseudo && (isLink || isDef)) {
      const href = e.target.getAttribute('href')
      for (const el of pseudo.querySelectorAll(`[href="${href}"]`)) {
        el.classList.remove('hover')
      }
      if (isPopup(pseudo)) {
        toggleHoverRelated(getPseudo(pseudo.getAttribute(PSEUDO_TARGET)), href, false)
      }
      HIDE_POPUP_TIMEOUT = setTimeout(() => {
        hidePopup()
      }, 300)
    }
  })
}
