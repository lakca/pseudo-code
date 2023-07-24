const browserify = require('browserify')
const through = require('through')
const stylus = require('stylus')
const fs = require('fs')

browserify()
  .add('browser.js')
  .transform((file) => {
    let data = '';
    return through(
      function write(buf) {
        data += buf
      },
      function end() {
        if (file.endsWith('.styl')) {
          data = stylus(data).render()
          data = 'module.exports = `' + data + '`'
        }
        this.queue(data)
        this.queue(null)
      })
  })
  .transform('uglifyify', { global: true })
  .bundle()
  .pipe(fs.createWriteStream('dist/browser.min.js'))
