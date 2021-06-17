/**
 * Module dependencies
 */

const User = require('../models/User')
const NotFoundError = require('../errors/NotFoundError')

/**
 * Export
 */

function patchUserInfo (req, res, next) {
  // Map updates given in the request body to attributes
  // in the scopes authorized by the access token.
  const scopeUserAttributes = []
  const authorizedUpdates = {}
  req.scopes.forEach(function (scope) {
    scope.attributes && scope.attributes.user && scope.attributes.user.forEach(function (key) {
      scopeUserAttributes.push(key)
      if (req.body && req.body[key] !== undefined) {
        authorizedUpdates[key] = req.body[key]
      }
    })
  })

  // Do the update and return the usual userinfo data
  // after the update is complete.
  User.patch(req.claims.sub, authorizedUpdates, {
    mapping: 'userinfo'
  }, function (err, user) {
    if (err) { return next(err) }
    if (!user) { return next(new NotFoundError()) }

    const projection = user.project('userinfo')
    const userInfo = { sub: projection.sub }

    scopeUserAttributes.forEach(function (key) {
      if (typeof projection[key] !== 'undefined') {
        userInfo[key] = projection[key]
      }
    })

    res.status(200).json(userInfo)
  })
}

module.exports = patchUserInfo
