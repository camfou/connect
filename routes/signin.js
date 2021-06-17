/**
 * Module dependencies
 */

const oidc = require('../oidc')
const settings = require('../boot/settings')
const mailer = require('../boot/mailer').getMailer()
const authenticator = require('../lib/authenticator')
const qs = require('qs')
const InvalidRequestError = require('../errors/InvalidRequestError')
const providers = require('../providers')

const providerInfo = {}
const providerNames = Object.keys(providers)
for (let i = 0; i < providerNames.length; i++) {
  providerInfo[providerNames[i]] = providers[providerNames[i]]
}
const visibleProviders = {}
// Only render providers that are not marked as hidden
Object.keys(settings.providers).forEach(function (providerID) {
  if (!settings.providers[providerID].hidden) {
    visibleProviders[providerID] = settings.providers[providerID]
  }
})

/**
 * Signin Endpoint
 */

module.exports = function (server) {
  /**
   * Signin page
   */

  server.get('/signin',
    oidc.selectConnectParams,
    oidc.verifyClient,
    oidc.validateAuthorizationParams,
    function (req, res, next) {
      delete req.connectParams.password
      res.render('signin', {
        params: qs.stringify(req.connectParams),
        request: req.connectParams,
        client: req.client,
        providers: visibleProviders,
        providerInfo: providerInfo,
        mailSupport: !!(mailer.transport)
      })
    })

  /**
   * Password signin handler
   */

  const handler = [
    oidc.selectConnectParams,
    oidc.whitelistParams,
    oidc.verifyClient,
    oidc.validateAuthorizationParams,
    oidc.determineProvider,
    oidc.enforceReferrer('/signin'),
    function (req, res, next) {
      if (!req.provider) {
        next(new InvalidRequestError('Invalid provider'))
      } else {
        authenticator.dispatch(req.connectParams.provider, req, res, next, function (err, user, info) {
          delete req.connectParams.password
          if (err) {
            res.render('signin', {
              params: qs.stringify(req.connectParams),
              request: req.connectParams,
              client: req.client,
              providers: visibleProviders,
              providerInfo: providerInfo,
              mailSupport: !!(mailer.transport),
              error: err.message
            })
          } else if (!user) {
            res.render('signin', {
              params: qs.stringify(req.connectParams),
              request: req.connectParams,
              client: req.client,
              providers: visibleProviders,
              providerInfo: providerInfo,
              mailSupport: !!(mailer.transport),
              formError: info.message
            })
          } else {
            authenticator.login(req, user)
            next()
          }
        })
      }
    },
    oidc.requireVerifiedEmail(),
    oidc.determineUserScope,
    oidc.promptToAuthorize,
    oidc.authorize
  ]

  if (oidc.beforeAuthorize) {
    handler.splice(handler.length - 1, 0, oidc.beforeAuthorize)
  }

  server.post('/signin', handler)
}
