/**
 * Module dependencies
 */

const settings = require('../boot/settings')

/**
 * Select Authorization Parameters
 */

function whitelistParams (req, res, next) {
  req.whitelistParams = settings.whitelist_request_params.reduce((whitelist, key) => {
    const value = req.connectParams[key]
    if (typeof value === 'undefined') {
      return whitelist
    }

    return {
      ...whitelist,
      [key]: value
    }
  }, {})
  next()
}

/**
 * Exports
 */

module.exports = whitelistParams
