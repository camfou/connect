/**
 * Module dependencies
 */

const oidc = require('../oidc')

/**
 * Exports
 */

module.exports = function (server) {
  server.use(oidc.error)
}
