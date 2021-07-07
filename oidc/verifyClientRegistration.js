/**
 * Module dependencies
 */

const settings = require('../boot/settings')
const UnauthorizedError = require('../errors/UnauthorizedError')

/**
 * Verify Client Registration
 *
 * NOTE:
 * verifyAccessToken and its dependencies should be used upstream.
 * This middleware assumes that if a token is present, it has already
 * been verified.
 *
 * It will invoke the error handler if any of the following are true
 * 1. a token is required, but not present
 * 2. registration contains the "trusted" property
 * 3. specific scope is required to register a client
 */

function verifyClientRegistration (req, res, next) {
  // check if we have a token and a token is required
  const registration = req.body
  const claims = req.claims
  const clientRegType = settings.client_registration
  const required = (registration.trusted || clientRegType !== 'dynamic')
  const trustedRegScope = settings.trusted_registration_scope
  const regScope = settings.registration_scope

  // can't continue because we don't have a token
  if (!(claims && claims.sub) && required) {
    return next(new UnauthorizedError({
      realm: 'user',
      error: 'invalid_request',
      error_description: 'Missing access token',
      statusCode: 400
    }))
  }

  // we have a token, so let's verify it
  if (claims && claims.sub) {
    // verify the trusted registration scope
    if (registration.trusted && !hasScope(claims, trustedRegScope)) {
      return next(new UnauthorizedError({
        realm: 'user',
        error: 'insufficient_scope',
        error_description: 'User does not have permission',
        statusCode: 403
      }))
    }

    // verify the registration scope
    if (!registration.trusted &&
      clientRegType === 'scoped' && !hasScope(claims, regScope)) {
      return next(new UnauthorizedError({
        realm: 'user',
        error: 'insufficient_scope',
        error_description: 'User does not have permission',
        statusCode: 403
      }))
    }

    next()

  // authorization not required/provided
  } else {
    next()
  }
}

function hasScope (claims, scope) {
  let cscope = claims && claims.scope

  // false if there's no scope
  if (!cscope) { return false }

  // split the values if they're strings
  if (typeof cscope === 'string') { cscope = cscope.split(' ') }

  // check if the token has any of the prescribed scope values
  return cscope.some(function (s) {
    return (scope && scope.indexOf(s) !== -1)
  })
}

/**
 * Exports
 */

module.exports = verifyClientRegistration
