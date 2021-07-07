/**
 * Module dependencies
 */

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
   * GET /v1/roles
   */

  server.get('/v1/roles', authorize, function (req, res, next) {
    Role.list({
      // options
    }, function (err, instances) {
      if (err) { return next(err) }
      res.json(instances)
    })
  })

  /**
   * GET /v1/roles/:id
   */

  server.get('/v1/roles/:id', authorize, function (req, res, next) {
    Role.get(req.params.id, function (err, instance) {
      if (err) { return next(err) }
      if (!instance) { return next(new NotFoundError()) }
      res.json(instance)
    })
  })

  /**
   * POST /v1/roles
   */

  server.post('/v1/roles', authorize, function (req, res, next) {
    Role.insert(req.body, function (err, instance) {
      if (err) { return next(err) }
      res.status(201).json(instance)
    })
  })

  /**
   * PATCH /v1/roles/:id
   */

  server.patch('/v1/roles/:id', authorize, function (req, res, next) {
    Role.patch(req.params.id, req.body, function (err, instance) {
      if (err) { return next(err) }
      if (!instance) { return next(new NotFoundError()) }
      res.json(instance)
    })
  })

  /**
   * DELETE /v1/roles/:id
   */

  server.delete('/v1/roles/:id', authorize, function (req, res, next) {
    Role.delete(req.params.id, function (err, result) {
      if (err) { return next(err) }
      if (!result) { return next(new NotFoundError()) }
      res.sendStatus(204)
    })
  })
}
