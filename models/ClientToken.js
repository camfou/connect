/**
 * Module dependencies
 */

var crypto = require('crypto')
const { JWS } = require('jose')
var nowSeconds = require('../lib/time-utils').nowSeconds

/**
 * Random
 */

function random () {
  return crypto.randomBytes(10).toString('hex')
}

/**
 * Issue
 */

exports.issue = function (claims, privateKey, callback) {
  try {
    const targetpayload = {
      jti: claims.jti || random(),
      iat: claims.iat || nowSeconds(),
      scope: claims.scope || 'client'
    }
    Object.assign(targetpayload, claims)
    const missingClaims = ['jti', 'iss', 'sub', 'aud', 'iat', 'scope'].some(requiredClaim => {
      return !targetpayload[requiredClaim]
    })
    if (missingClaims) {
      return callback(new Error('Missing claims'))
    }
    return callback(null, JWS.sign(targetpayload, privateKey, { alg: 'RS256' }))
  } catch (err) {
    return callback(err)
  }
}
