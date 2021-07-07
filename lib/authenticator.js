/**
 * Module dependencies
 */

const crypto = require('crypto')
const settings = require('../boot/settings')
const providers = require('../providers')
const protocols = require('../protocols')
const setSessionAmr = require('../oidc/setSessionAmr')
const User = require('../models/User')

/**
 * Strategies
 */

const strategies = {}

/**
 * Authenticator
 */

function Authenticator () {}

/**
 * Register Providers
 */

function registerProviders () {
  Object.keys(settings.providers).forEach(function (id) {
    const providerConf = settings.providers[id]
    const provider = providers[id] ? providers[id] : providerConf

    const strategy = protocols.initialize(id, provider, providerConf)
    strategies[id] = strategy
  })
}

Authenticator.registerProviders = registerProviders

/**
 * Set req.user
 */

function setUserOnRequest (req, res, next) {
  if (!req.session || !req.session.user) {
    return next()
  }

  User.get(req.session.user, function (err, user) {
    if (err) {
      return next(err)
    }
    if (!user) {
      delete req.session.user
      return next()
    }
    req.user = user
    next()
  })
}

Authenticator.setUserOnRequest = setUserOnRequest

/**
 * Dispatch
 */

function dispatch (provider, req, res, next, options, callback) {
  const baseStrategy = strategies[provider]

  if (!baseStrategy) {
    const cb = callback || next
    return cb(new Error(
      'No strategy defined for provider \'' +
      provider + '\''
    ))
  }

  if (!callback && typeof options === 'function') {
    callback = options
    options = {}
  }

  const strategy = Object.create(baseStrategy)

  strategy.success = function (user, info) {
    req.user = user
    if (callback) {
      callback(null, user, info)
    } else {
      next()
    }
  }

  strategy.fail = function (info, status) {
    if (callback) {
      callback(null, null, info)
    } else {
      setUserOnRequest(req, res, next)
    }
  }

  strategy.pass = function () {
    next()
  }

  strategy.error = function (err) {
    if (callback) {
      callback(err)
    } else {
      next(err)
    }
  }

  strategy.redirect = function (url, status) {
    res.redirect(status || 302, url)
  }

  strategy.authenticate(req, options)
}

Authenticator.dispatch = dispatch

/**
 * Login
 */

function login (req, user) {
  setSessionAmr(req.session, req.provider.amr)

  // only update the OP Browser State if the user is not already logged in
  if (req.session.user !== user._id) {
    req.session.user = user._id
    req.session.opbs = crypto.randomBytes(256).toString('hex')
  }
}

Authenticator.login = login

/**
 * Logout
 */

function logout (req) {
  req.user = null
  delete req.session.user
  req.session.opbs = crypto.randomBytes(256).toString('hex')
  delete req.session.amr
}

Authenticator.logout = logout

/**
 * Exports
 */

module.exports = Authenticator
