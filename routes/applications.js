/**
 * Module dependencies
 */

const oidc = require('../oidc')
const settings = require('../boot/settings')
const userApplications = require('../models/UserApplications')

/**
 * Exports
 */

module.exports = function (server) {
  /**
   * Applications
   */

  server.get('/applications',
    oidc.parseAuthorizationHeader,
    oidc.getBearerToken,
    oidc.verifyAccessToken({
      iss: settings.issuer,
      key: settings.keys.sig.pub,
      required: false
    }),
    oidc.authenticateUser,
    function (req, res, next) {
      userApplications(req.user, function (err, apps) {
        if (err) { return next(err) }
        res.json(apps)
      })
    })
}
