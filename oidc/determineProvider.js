/**
 * Module dependencies
 */

const settings = require('../boot/settings')
const providers = require('../providers')

/**
 * Determine provider middleware
 */

function determineProvider (req, res, next) {
  const providerID = req.params.provider || req.body.provider
  if (providerID && settings.providers[providerID]) {
    req.provider = providers[providerID]
  }
  next()
}

/**
 * Module export
 */

module.exports = determineProvider
