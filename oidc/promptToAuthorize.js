/**
 * Module dependencies
 */

const qs = require('qs')
const AccessToken = require('../models/AccessToken')

/**
 * Prompt to authorize
 */

function promptToAuthorize (req, res, next) {
  const params = req.connectParams
  const client = req.client
  const user = req.user
  const scopes = req.scopes

  // The client is not trusted and the user has yet to decide on consent
  if (client.trusted !== true && typeof params.authorize === 'undefined') {
    // check for pre-existing consent
    AccessToken.exists(user._id, client._id, function (err, exists) {
      if (err) { return next(err) }

      // if there's an existin authorization,
      // reuse it and continue
      if (exists) {
        params.authorize = 'true'
        next()

      // otherwise, prompt for consent
      } else {
        // render the consent view
        if (req.path === '/authorize') {
          res.render('authorize', {
            request: params,
            client: client,
            user: user,
            scopes: scopes
          })

        // redirect to the authorize endpoint
        } else {
          res.redirect('/authorize?' + qs.stringify(params))
        }
      }
    })

  // The client is trusted and consent is implied.
  } else if (client.trusted === true) {
    params.authorize = 'true'
    next()

  // The client is not trusted and consent is decided
  } else {
    next()
  }
}

/**
 * Exports
 */

module.exports = promptToAuthorize
