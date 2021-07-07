/**
 * Module dependencies
 */

const User = require('../models/User')
const UnauthorizedError = require('../errors/UnauthorizedError')

/**
 * Authenticate User
 */

function authenticateUser (req, res, next) {
  // Check for verified access token
  if (req.claims && req.claims.sub) {
    User.get(req.claims.sub, function (err, user) {
      if (err) {
        return next(err)
      }

      if (!user) {
        return next(new UnauthorizedError({
          realm: 'user',
          error: 'unknown_user',
          error_description: 'Unknown user',
          statusCode: 401
        }))
      }

      req.user = user
      next()
    })

  // User is not authenticated.
  } else if (!req.user) {
    next(new UnauthorizedError({
      statusCode: 401
    }))

  // User is authenticated.
  } else {
    next()
  }
}

/**
 * Exports
 */

module.exports = authenticateUser
