/**
 * Module dependencies
 */

const crypto = require('crypto')
const JWT = require('camfou-connect-jwt')
const nowSeconds = require('../lib/time-utils').nowSeconds

/**
 * Client Access Token
 */

const ClientToken = JWT.define({
  // default header
  header: {
    alg: 'RS256'
  },

  // permitted headers
  headers: [
    'alg'
  ],

  // modify header schema
  registeredHeaders: {
    alg: { format: 'StringOrURI', required: true, enum: ['RS256'] }
  },

  // permitted claims
  claims: ['jti', 'iss', 'sub', 'aud', 'exp', 'iat', 'scope'],

  // modify payload schema
  registeredClaims: {
    jti: { format: 'String', required: true, default: random },
    iss: { format: 'StringOrURI', required: true },
    sub: { format: 'StringOrURI', required: true },
    aud: { format: 'StringOrURI', required: true },
    exp: { format: 'IntDate' },
    iat: { format: 'IntDate', required: true, default: nowSeconds },
    scope: { format: 'String', required: true, default: 'client' }
  }

})

/**
 * Random
 */

function random () {
  return crypto.randomBytes(10).toString('hex')
}

/**
 * Issue
 */

ClientToken.issue = function (claims, privateKey, callback) {
  try {
    const token = new ClientToken(claims)
    const jwt = token.encode(privateKey)
    return callback(null, jwt)
  } catch (err) {
    callback(err)
  // callback(new Error('Unable to issue client access token'))
  }
}

/**
 * Exports
 */

module.exports = ClientToken
