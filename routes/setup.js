/**
 * Module dependencies
 */

const settings = require('../boot/settings')
const setup = require('../boot/setup')
const Client = require('../models/Client')
const User = require('../models/User')
const NotFoundError = require('../errors/NotFoundError')
const InvalidRequestError = require('../errors/InvalidRequestError')

/**
 * Setup Endpoint
 */

module.exports = function (server) {
  server.post('/setup', [
    function (req, res, next) {
      setup.isOOB(function (err, oob) {
        if (err) { return next(err) }

        // Only continue if the server is in out-of-box mode
        if (oob) {
          return next()
        } else {
          return next(new NotFoundError())
        }
      })
    },
    function (req, res, next) {
      // 1. Get token from file
      const token = settings.setupToken
      // 2. Check that token matches token in POST body
      if (req.body.token !== token) {
        return next(new NotFoundError())
      }
      // 3. Create user with given details/credentials
      if (!req.body.email || !req.body.password) {
        return next(new InvalidRequestError('Missing credentials'))
      }
      User.insert(req.body, function (err, user) {
        if (err) { return next(err) }

        // 4. Assign user administrator/authority role
        User.addRoles(user, 'authority', function (err, result) {
          if (err) { return next(err) }

          // 5. Register client
          Client.insert({
            client_name: 'Anvil Connect CLI',
            redirect_uris: [settings.issuer],
            trusted: true
          }, function (err, client) {
            if (err) { return next(err) }

            // 6. Return with client and user details
            res.status(201).send({
              user: user.project('userinfo'),
              client: client.project('registration')
            })
          })
        })
      })
    }
  ])
}
