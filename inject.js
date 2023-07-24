const { NODE } = require('./def')

module.exports = function inject() {
  document.body.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains(NODE.LINK) || e.target.classList.contains(NODE.DEF)) {
      for (const el of e.target.closest('.PSEUDO-CODE').querySelectorAll('[href="' + e.target.getAttribute('href') + '"]')) {
        el.classList.add('hover')
      }
    }
  })
  document.body.addEventListener('mouseout', (e) => {
    if (e.target.classList.contains(NODE.LINK) || e.target.classList.contains(NODE.DEF)) {
      for (const el of e.target.closest('.PSEUDO-CODE').querySelectorAll('[href="' + e.target.getAttribute('href') + '"]')) {
        el.classList.remove('hover')
      }
    }
  })
}
