/* global __dirname */

/**
 * Module dependencies
 */

const fs = require('fs')
const path = require('path')

/**
 * Read models directory
 */

const files = fs.readdirSync(__dirname)

/**
 * Load models
 */

files.forEach(function (file) {
  if (path.extname(file) === '.js' && file !== 'index.js') {
    const model = path.basename(file, '.js')
    module.exports[model] = require(path.join(__dirname, '..', 'models', model))
  }
})
