/* eslint camelcase: 0 */ // --> Disable camelcase check because of function declaration below.

/**
 * Module dependencies
 */

const async = require('async')
const semver = require('semver')
const providers = require('../providers')
const User = require('../models/User')
const rclient = require('../boot/redis').getClient()

/**
 * Migration
 *
 * 0.1.54 and prior did not namespace user-by-provider indexes
 */

module.exports = function (version) {
  return function migration_0_1_55 (next) {
    if (semver.satisfies(version, '<0.1.55')) {
      const providerIDs = Object.keys(providers)

      async.map(providerIDs, function (provider, callback) {
        const index = User.collection + ':' + provider
        const newIndex = User.collection + ':provider:' + provider

        rclient.hgetall(index, function (err, result) {
          if (err) { return callback(err) }

          if (result && Object.getOwnPropertyNames(result).length) {
            rclient.rename(index, newIndex, function (err) {
              if (err) { return callback(err) }

              return callback()
            })
          } else {
            return callback()
          }
        })
      }, next)
    } else { next() }
  }
}
