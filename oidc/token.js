/**
 * Module dependencies
 */

const settings = require('../boot/settings')
const AccessToken = require('../models/AccessToken')
const ClientToken = require('../models/ClientToken')
const IDToken = require('../models/IDToken')
const nowSeconds = require('../lib/time-utils').nowSeconds
const sessionState = require('../oidc/sessionState')

/**
 * Exchange code for token
 */

const privateKey = settings.keys.sig.prv

function token (req, res, next) {
  const params = req.body
  const client = req.client
  const ac = req.code

  function tokenResponse (err, token) {
    if (err) {
      return next(err)
    }

    let idToken
    const response = token.project('issue')

    if (req.client.access_token_type !== 'random') {
      response.access_token = token.toJWT(privateKey)
    }

    if (ac) {
      idToken = new IDToken({
        iss: settings.issuer,
        sub: ac.user_id,
        aud: ac.client_id,
        exp: nowSeconds(token.ei),
        amr: req.session.amr
      })

      if (ac.nonce) {
        idToken.payload.nonce = ac.nonce
      }
    } else {
      idToken = new IDToken({
        iss: settings.issuer,
        sub: token.uid,
        aud: token.cid,
        exp: nowSeconds(token.ei),
        amr: req.session.amr
      })
    }

    const opbs = req.session.opbs
    response.id_token = idToken.encode(privateKey)
    response.session_state = sessionState(client, client.client_uri, opbs)

    if (params.state) {
      response.state = params.state
    }

    res.set({
      'Cache-Control': 'no-store',
      Pragma: 'no-cache'
    })

    res.json(response)
  }

  // AUTHORIZATION CODE GRANT
  if (params.grant_type === 'authorization_code') {
    AccessToken.exchange(req, tokenResponse)

  // REFRESH GRANT
  } else if (params.grant_type === 'refresh_token') {
    const refreshToken = params.refresh_token
    const clientId = req.client._id

    AccessToken.refresh(refreshToken, clientId, tokenResponse)

  // CLIENT CREDENTIALS GRANT (OAuth 2.0)
  } else if (params.grant_type === 'client_credentials') {
    ClientToken.issue({
      iss: settings.issuer,
      sub: req.client._id,
      aud: req.client._id,
      exp: nowSeconds(req.client.default_max_age),
      scope: req.scope
    }, privateKey, function (err, token) {
      if (err) { return next(err) }

      res.set({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache'
      })

      const response = {
        access_token: token,
        token_type: 'Bearer'
      }

      if (req.client.default_max_age) {
        response.expires_in = req.client.default_max_age
      }

      res.json(response)
    })
  } else {
    // ????
  }
}

/**
 * Exports
 */

module.exports = token
