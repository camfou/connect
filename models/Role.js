/**
 * Module dependencies
 */

const client = require('../boot/redis').getClient()
const Modinha = require('camfou-modinha')
const Document = require('camfou-modinha-redis')

/**
 * Model definition
 */

const Role = Modinha.define('roles', {
  name: { type: 'string', required: true, uniqueId: true }
})

/**
 * Document persistence
 */

Role.extend(Document)
Role.__client = client

/**
 * Role intersections
 */

Role.intersects('users')
Role.intersects('clients')
Role.intersects('scopes')

/**
 * Exports
 */

module.exports = Role
