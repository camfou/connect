/**
 * Module dependencies
 */

const Scope = require('../models/Scope')

/**
 * Determine client scope
 */

function determineClientScope (req, res, next) {
  const params = req.connectParams
  const subject = req.client
  const scope = params.scope || subject.default_client_scope

  if (params.grant_type === 'client_credentials') {
    Scope.determine(scope, subject, function (err, scope, scopes) {
      if (err) { return next(err) }
      req.scope = scope
      req.scopes = scopes
      next()
    })
  } else {
    next()
  }
}

/**
 * Exports
 */

module.exports = determineClientScope
