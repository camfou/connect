/**
 * Module dependencies
 */

const fs = require('fs')
const path = require('path')
const semver = require('semver')

/**
 * Load migrations
 */

function loadMigrations (version) {
  const migrations = []
  const files = fs.readdirSync(__dirname)

  // iterate through the files and load required modules
  files.forEach(function (file) {
    const isJavaScript = path.extname(file) === '.js'
    const isMigration = ['baseline.js', 'index.js'].indexOf(file) === -1
    const isRequired = isMigration && !semver.satisfies(path.basename(file, '.js'))

    if (isJavaScript && isMigration && isRequired) {
      migrations.push(require(path.join(__dirname, file))(version))
    }
  })

  return migrations
}
/**
 * Export
 */

module.exports = loadMigrations
