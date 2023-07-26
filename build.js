const browserify = require('browserify')
const through = require('through')
const stylus = require('stylus')
const fs = require('fs')
const { PSEUDO_CODE } = require('./def')

browserify()
  .add('browser.js')
  .transform((file) => {
    console.log(file)
    let data = '';
    return through(
      function write(buf) {
        data += buf
      },
      function end() {
        if (file.endsWith('.styl')) {
          data = stylus(data)
            .define('PSEUDO_CODE', PSEUDO_CODE)
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
