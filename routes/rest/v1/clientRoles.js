/**
 * Module dependencies
 */

const Client = require('../../../models/Client')
const Role = require('../../../models/Role')
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
   * GET /v1/clients/:clientId/roles
   */

  server.get('/v1/clients/:clientId/roles',
    authorize,
    function (req, res, next) {
      // first, ensure the client exists
      Client.get(req.params.clientId, function (err, instance) {
        if (err) { return next(err) }
        if (!instance) { return next(new NotFoundError()) }

        // then list roles by account
        Role.listByClients(req.params.clientId, function (err, instances) {
          if (err) { return next(err) }
          res.json(instances)
        })
      })
    })

  /**
   * PUT /v1/clients/:clientId/roles/:roleId
   */

  server.put('/v1/clients/:clientId/roles/:roleId',
    authorize,
    function (req, res, next) {
      Client.get(req.params.clientId, function (err, instance) {
        if (err) { return next(err) }
        if (!instance) { return next(new NotFoundError()) }

        Role.get(req.params.roleId, function (err, role) {
          if (err) { return next(err) }
          if (!role) { return next(new NotFoundError()) }

          instance.addRoles(req.params.roleId, function (err, result) {
            if (err) { return next(err) }
            res.json({ added: true })
          })
        })
      })
    })

  /**
   * DELETE /v1/clients/:clientId/roles/:roleId
   */

  server.delete('/v1/clients/:clientId/roles/:roleId',
    authorize,
    function (req, res, next) {
      Client.get(req.params.clientId, function (err, instance) {
        if (err) { return next(err) }
        if (!instance) { return next(new NotFoundError()) }

        instance.removeRoles(req.params.roleId, function (err, result) {
          if (err) { return next(err) }
          res.sendStatus(204)
        })
      })
    })
}
