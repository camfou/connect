/**
 * Module dependencies
 */

const oidc = require('../oidc')
const settings = require('../boot/settings')
const passwordProvider = require('../providers').password
const authenticator = require('../lib/authenticator')
const qs = require('qs')
const User = require('../models/User')
const PasswordsDisabledError = require('../errors/PasswordsDisabledError')

/**
 * Signup Endpoint
 */

module.exports = function (server) {
  /**
   * Signup page
   */

  const getSignupHandler = [
    oidc.selectConnectParams,
    oidc.verifyClient,
    oidc.validateAuthorizationParams,
    function (req, res, next) {
      res.render('signup', {
        params: qs.stringify(req.connectParams),
        request: req.connectParams,
        client: req.client,
        providers: settings.providers
      })
    }
  ]

  /**
   * Password signup handler
   */

  function createUser (req, res, next) {
    User.insert(req.connectParams, { private: true }, function (err, user) {
      if (err) {
        delete req.connectParams.password
        res.render('signup', {
          params: qs.stringify(req.connectParams),
          request: req.connectParams,
          client: req.client,
          providers: settings.providers,
          error: err.message
        })
      } else {
        authenticator.dispatch('password', req, res, next, function (err, user, info) {
          delete req.connectParams.password
          if (err) { return next(err) }
          if (user) {
            authenticator.login(req, user)
            req.sendVerificationEmail = req.provider.emailVerification.enable
            req.flash('isNewUser', true)
            next()
          }
        })
      }
    })
  }

  function usePasswordProvider (req, res, next) {
    req.provider = passwordProvider
    next()
  }

  const postSignupHandler = [
    oidc.selectConnectParams,
    oidc.whitelistParams,
    oidc.verifyClient,
    oidc.validateAuthorizationParams,
    usePasswordProvider,
    oidc.enforceReferrer('/signup'),
    createUser,
    oidc.sendVerificationEmail,
    oidc.requireVerifiedEmail(),
    oidc.determineUserScope,
    oidc.promptToAuthorize,
    oidc.authorize
  ]

  if (oidc.beforeAuthorize) {
    postSignupHandler.splice(postSignupHandler.length - 1, 0, oidc.beforeAuthorize)
  }

  /**
   * Passwords Disabled Handler
   */

  function passwordsDisabledHandler (req, res, next) {
    next(new PasswordsDisabledError())
  }

  // Only register the password signup handlers
  // if the password protocol is enabled.
  if (settings.providers.password) {
    server.get('/signup', getSignupHandler)
    server.post('/signup', postSignupHandler)
  } else {
    server.get('/signup', passwordsDisabledHandler)
    server.post('/signup', passwordsDisabledHandler)
  }
}
