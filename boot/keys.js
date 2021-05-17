/* global process */

/**
 * Module dependencies
 */

const AnvilConnectKeys = require('anvil-connect-keys')

/**
 * Create a keypair client
 */

const keygen = new AnvilConnectKeys()

const loadKeyPairs = () => {
  keys = keygen.loadKeyPairs()
  keys.jwks.keys = keys.jwks.keys.map((key, index) => {
    return {
      ...key,
      kid: 'key-' + index
    }
  })

  return keys
}

/**
 * Attempt to load the key pairs
 */

let keys
try { keys = loadKeyPairs() } catch (e) {}

/**
 * If the keypairs don't exist, try to create them
 */
if (!keys) {
  try {
    keygen.generateKeyPairs()
    keys = loadKeyPairs()
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
}

/**
 * Export
 */
module.exports = keys
