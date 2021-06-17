/**
 * Module dependencies
 */

const request = require('superagent')
const providers = require('../providers')
const User = require('../models/User')
const InvalidRequestError = require('../errors/InvalidRequestError')

/**
 * Revoke
 */

function revoke (req, res, next) {
  const provider = providers[req.params.provider]
  const endpoint = provider && provider.endpoints && provider.endpoints.revoke

  if (!provider) {
    return next(new InvalidRequestError('Unknown provider'))
  }

  if (!endpoint) {
    return next(new InvalidRequestError('Undefined revoke endpoint'))
  }

  User.get(req.claims.sub, function (err, user) {
    if (err) {
      return next(err)
    }

    if (!user) {
      return next(new InvalidRequestError('Unknown user'))
    }

    if (!user.providers[req.params.provider]) {
      return next(new InvalidRequestError('No provider for this user'))
    }

    const auth = user.providers[req.params.provider].auth
    const url = endpoint.url
    const method = endpoint.method.toLowerCase()
    const param = endpoint.auth && endpoint.auth.param
    const token = auth && auth.access_token

    request[method](url)
      .query(param + '=' + token)
      .end(function (err, response) {
        res.json({
          err: err,
          response: response
        })
      })
  })
}

/**
 * Exports
 */

module.exports = revoke
