const browserify = require('browserify')
const through = require('through')
const stylus = require('stylus')
const fs = require('fs')
const { PSEUDO_CODE, PSEUDO, INJECT_FLAG, PSEUDO_TARGET } = require('./def')

browserify()
  .add('browser.js')
  .transform((file) => {
    console.log(file)
    let data = ''
    return through(
      function write(buf) {
        data += buf
      },
      function end() {
        if (file.endsWith('.styl')) {
          data = stylus(data)
            .define('PSEUDO', PSEUDO)
            .define('PSEUDO_CODE', PSEUDO_CODE)
            .define('PSEUDO_TARGET', PSEUDO_TARGET)
            .define('INJECT_FLAG', INJECT_FLAG)
            .render()
          data = 'module.exports = `' + data + '`'
        }
        this.queue(data)
        this.queue(null)
      })
  })
  .transform('uglifyify', { global: true })
  .bundle()
  .pipe(fs.createWriteStream('dist/browser.min.js'))
