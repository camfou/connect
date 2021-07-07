/* global process */

/**
 * Module dependencies
 */

const cwd = process.cwd()
const path = require('path')

/**
 * OIDC Middlewares
 */

const oidc = {
  authenticateClient: require('./authenticateClient'),
  authenticateUser: require('./authenticateUser'),
  authorize: require('./authorize'),
  checkSession: require('./checkSession'),
  determineUserScope: require('./determineUserScope'),
  determineClientScope: require('./determineClientScope'),
  determineProvider: require('./determineProvider'),
  enforceReferrer: require('./enforceReferrer'),
  error: require('./error'),
  getAuthorizedScopes: require('./getAuthorizedScopes'),
  getBearerToken: require('./getBearerToken'),
  getUserInfo: require('./getUserInfo'),
  parseAuthorizationHeader: require('./parseAuthorizationHeader'),
  patchUserInfo: require('./patchUserInfo'),
  promptToAuthorize: require('./promptToAuthorize'),
  requireVerifiedEmail: require('./requireVerifiedEmail'),
  requireSignin: require('./requireSignin'),
  revoke: require('./revoke'),
  selectConnectParams: require('./selectConnectParams'),
  sendVerificationEmail: require('./sendVerificationEmail'),
  session: require('./session'),
  sessionEvents: require('./sessionEvents'),
  sessionState: require('./sessionState'),
  setSessionAmr: require('./setSessionAmr'),
  signout: require('./signout'),
  stashParams: require('./stashParams'),
  token: require('./token'),
  unstashParams: require('./unstashParams'),
  validateAuthorizationParams: require('./validateAuthorizationParams'),
  validateTokenParams: require('./validateTokenParams'),
  verifyAccessToken: require('./verifyAccessToken'),
  verifyClient: require('./verifyClient'),
  verifyClientRegistration: require('./verifyClientRegistration'),
  verifyClientToken: require('./verifyClientToken'),
  verifyClientIdentifiers: require('./verifyClientIdentifiers'),
  verifyEmail: require('./verifyEmail'),
  verifyRedirectURI: require('./verifyRedirectURI'),
  verifyAuthorizationCode: require('./verifyAuthorizationCode'),
  whitelistParams: require('./whitelistParams')
}

/**
 * Load Hooks
 */

try {
  oidc.beforeAuthorize = require(path.join(cwd, 'hooks', 'beforeAuthorize'))
} catch (e) {}

/**
 * Exports
 */

module.exports = oidc
