/**
 * Module dependencies
 */

const util = require('util')

/**
 * ProviderError
 */

function ProviderError (message) {
  this.name = 'ProviderError'
  this.message = message
}

util.inherits(ProviderError, Error)

/**
 * Exports
 */

module.exports = ProviderError
