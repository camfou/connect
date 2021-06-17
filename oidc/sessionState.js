/**
 * Module dependencies
 */

const crypto = require('crypto')

/**
 * Session State
 */

function sessionState (client, origin, state) {
  const salt = crypto.randomBytes(16).toString('hex')
  const value = [client._id, client.client_uri, state, salt].join(' ')
  const sha256 = crypto.createHash('sha256')
  sha256.update(value)
  const hash = sha256.digest('hex')
  return [hash, salt].join('.')
}

/**
 * Exports
 */

module.exports = sessionState
