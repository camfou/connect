/**
 * Module dependencies
 */

const Role = require('../../../models/Role')
const Scope = require('../../../models/Scope')
const NotFoundError = require('../../../errors/NotFoundError')
const settings = require('../../../boot/settings')
const oidc = require('../../../oidc')

/**
 * Export
 */

module.exports = function (server) {
  /**
   * Token-based Auth Middleware
   */

  const authorize = [
    oidc.parseAuthorizationHeader,
    oidc.getBearerToken,
    oidc.verifyAccessToken({
      iss: settings.issuer,
      key: settings.keys.sig.pub,
      scope: 'realm'
    })
  ]

  /**
   * GET /v1/roles/:roleId/scopes
   */

  server.get('/v1/roles/:roleId/scopes',
    authorize,
    function (req, res, next) {
      // first, ensure the account exists
      Role.get(req.params.roleId, function (err, instance) {
        if (err) { return next(err) }
        if (!instance) { return next(new NotFoundError()) }

        // then list scopes by account
        Scope.listByRoles(req.params.roleId, function (err, instances) {
          if (err) { return next(err) }
          res.json(instances)
        })
      })
    })

  /**
   * PUT /v1/roles/:roleId/scopes/:scopeId
   */

  server.put('/v1/roles/:roleId/scopes/:scopeId',
    authorize,
    function (req, res, next) {
      Role.get(req.params.roleId, function (err, instance) {
        if (err) { return next(err) }
        if (!instance) { return next(new NotFoundError()) }

        Scope.get(req.params.scopeId, function (err, scope) {
          if (err) { return next(err) }
          if (!scope) { return next(new NotFoundError()) }

          instance.addScopes(req.params.scopeId, function (err, result) {
            if (err) { return next(err) }
            res.json({ added: true })
          })
        })
      })
    })

  /**
   * DELETE /v1/roles/:roleId/scopes/:scopeId
   */

  server.delete('/v1/roles/:roleId/scopes/:scopeId',
    authorize,
    function (req, res, next) {
      Role.get(req.params.roleId, function (err, instance) {
        if (err) { return next(err) }
        if (!instance) { return next(new NotFoundError()) }

        instance.removeScopes(req.params.scopeId, function (err, result) {
          if (err) { return next(err) }
          res.sendStatus(204)
        })
      })
    })
}
