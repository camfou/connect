/**
 * Module dependencies
 */

const cwd = process.cwd()
const path = require('path')
const glob = require('glob')

/**
 * Extend
 */

function extend () {
  const directory = path.join(cwd, 'extensions', '*.js')
  const extensions = glob.sync(directory)

  extensions.forEach(function (filename) {
    try {
      require(filename)()
    } catch (e) {
      console.log('Cannot load extension"', filename, '"')
    }
  })
}

/**
 * Export
 */

module.exports = extend
