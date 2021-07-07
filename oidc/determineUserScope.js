/**
 * Module dependencies
 */

const Scope = require('../models/Scope')

/**
 * Determine user scope
 */

function determineUserScope (req, res, next) {
  const params = req.connectParams
  const scope = params.scope
  const subject = req.user

  Scope.determine(scope, subject, function (err, scope, scopes) {
    if (err) { return next(err) }
    req.scope = scope
    req.scopes = scopes
    next()
  })
}

/**
 * Exports
 */

module.exports = determineUserScope
