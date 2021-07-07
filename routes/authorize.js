/**
 * Module dependencies
 */

const oidc = require('../oidc')

/**
 * Authorize Endpoint
 */

module.exports = function (server) {
  const handler = [
    oidc.selectConnectParams,
    oidc.whitelistParams,
    oidc.verifyClient,
    oidc.validateAuthorizationParams,
    oidc.requireSignin,
    oidc.determineUserScope,
    oidc.promptToAuthorize,
    oidc.authorize
  ]

  if (oidc.beforeAuthorize) {
    handler.splice(handler.length - 1, 0, oidc.beforeAuthorize)
  }

  server.get('/authorize', handler)
  server.post('/authorize', handler)
}
