/**
 * Module dependencies
 */

const settings = require('../boot/settings')
const ClientToken = require('../models/ClientToken')
const UnauthorizedError = require('../errors/UnauthorizedError')

/**
 * Client Bearer Token Authentication Middleware
 */

function verifyClientToken (req, res, next) {
  const header = req.headers.authorization

  // missing header
  if (!header) {
    return next(new UnauthorizedError({
      realm: 'client',
      error: 'unauthorized_client',
      error_description: 'Missing authorization header',
      statusCode: 403
    }))

  // header found
  } else {
    const jwt = header.replace('Bearer ', '')
    const token = ClientToken.decode(jwt, settings.keys.sig.pub)

    // failed to decode
    if (!token || token instanceof Error) {
      next(new UnauthorizedError({
        realm: 'client',
        error: 'unauthorized_client',
        error_description: 'Invalid access token',
        statusCode: 403
      }))

    // decoded successfully
    } else {
      // validate token
      req.token = token
      next()
    }
  }
}

/**
 * Exports
 */

module.exports = verifyClientToken
