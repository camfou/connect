/**
 * Module dependencies
 */

const settings = require('./settings')
const Redis = require('ioredis')

/**
 * Get client
 */

let client

exports.getClient = function () {
  if (client) {
    return client
  } else {
    client = new Redis(settings.redis)
    return client
  }
}
