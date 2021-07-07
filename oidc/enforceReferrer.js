/**
 * Module dependencies
 */

const settings = require('../boot/settings')
const { URL } = require('url')
const InvalidRequestError = require('../errors/InvalidRequestError')

/**
 * Enforce referrer middleware
 */

const errorMsg = 'Invalid referrer'

module.exports = function (pathname) {
  // Allow multiple pathnames, or one if you so prefer
  if (typeof pathname === 'string') {
    pathname = [pathname]
  }

  const host = new URL(settings.issuer).host

  return function enforceReferrer (req, res, next) {
    let referrer = req.get('referrer')

    // Only allow requests with a referrer defined
    if (!referrer) {
      return next(new InvalidRequestError(errorMsg))
    }

    referrer = new URL(referrer)

    // If the domains don't match, no bueno; issue an error.
    if (referrer.host !== host) {
      return next(new InvalidRequestError(errorMsg))
    }

    let match = false

    // Check the referrer pathname against every whitelisted
    // path. As long as one matches, `match` will be true and
    // we'll let the request through. If none match, `match`
    // will be false and we'll issue an error.
    for (let i = 0; i < pathname.length; i++) {
      if (pathname[i] === referrer.pathname) {
        match = true
        break
      }
    }

    if (!match) {
      return next(new InvalidRequestError(errorMsg))
    }

    next()
  }
}
