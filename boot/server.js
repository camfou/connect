/* global process, __dirname */

// Ensure running a compatible version of Node before getting too far...
const semver = require('semver')
const packageJson = require('../package.json')
if (packageJson.engines &&
  packageJson.engines.node &&
  !semver.satisfies(process.versions.node, packageJson.engines.node)) {
  console.error('Incompatible version of node - running [%s] but require [%s]',
    process.versions.node, packageJson.engines.node)
  process.exit(1)
}

/**
 * Configuration dependencies
 */

const cwd = process.cwd()
const path = require('path')
const settings = require('./settings')
const setup = require('./setup')
const client = require('./redis').getClient()
const logger = require('./logger')(settings.logger)
require('./mailer').getMailer()
require('./migrate')()
require('./extend')()
const authenticator = require('../lib/authenticator')
const express = require('express')
const cons = require('consolidate')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const connectFlash = require('connect-flash')
const cors = require('cors')
const sessionStore = new RedisStore({ client: client })

/**
 * Read setup token if the server is in out-of-box mode
 */

setup.isOOB(function (err, oob) {
  if (err) { return console.log(err) }
  if (oob) {
    setup.readSetupToken(function (err, token) {
      if (err) { return console.log(err) }
      settings.setupToken = token
    })
  }
})

/**
 * Exports
 */

module.exports = function (server) {
  /**
   * Disable default header
   */

  server.disable('x-powered-by')

  /**
   * Views configuration
   */

  const engine = settings.view_engine || 'pug'
  server.engine(engine, cons[engine])
  server.set('view engine', engine)

  // First, look for views in the project directory.
  // If absent, look in the package views directory.
  server.set('views', [
    path.join(cwd, 'views'),
    path.join(__dirname, '..', 'views')
  ])

  /**
   * Add to global the list of whitelisted params
   * So we can loop over it in the views template
   */

  server.locals.whitelist_params = settings.whitelist_request_params || []

  /**
   * Settings
   */

  Object.keys(settings).forEach(function (key) {
    server.set(key, settings[key])
  })

  /**
   * Request Parsing
   */

  server.use(cookieParser(settings.cookie_secret))
  server.use(bodyParser.urlencoded({ extended: false }))
  server.use(bodyParser.json())

  /**
   * Express Session
   */

  if (process.env.NODE_ENV === 'production') {
    server.use(session({
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      secret: settings.session_secret,
      proxy: true,
      cookie: {
        secure: true
      }
    }))
  } else {
    server.use(session({
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      secret: settings.session_secret
    }))
  }

  /**
   * Flash messaging
   */

  server.use(connectFlash())

  /**
   * Set user on request
   */

  server.use(authenticator.setUserOnRequest)

  /**
   * Cross-Origin Support
   */

  server.use(cors())

  /**
   * Logging
   */

  server.use(logger)

  /**
   * Serve Static Files
   *
   * First, look for files in the project `public` directory.
   * If absent, look in the package `public` directory.
   */

  server.use(express.static(path.join(cwd, 'public')))
  server.use(express.static(path.join(__dirname, '..', 'public')))

  /**
   * OpenID Provider Metadata Properties
   */

  const parameters = [
    'issuer',
    'authorization_endpoint',
    'token_endpoint',
    'userinfo_endpoint',
    'jwks_uri',
    'registration_endpoint',
    'scopes_supported',
    'response_types_supported',
    'response_modes_supported',
    'grant_types_supported',
    'acr_values_supported',
    'subject_types_supported',
    'id_token_signing_alg_values_supported',
    'id_token_encryption_alg_values_supported',
    'id_token_encryption_enc_values_supported',
    'userinfo_signing_alg_values_supported',
    'userinfo_encryption_alg_values_supported',
    'userinfo_encryption_enc_values_supported',
    'request_object_signing_alg_values_supported',
    'request_object_encryption_alg_values_supported',
    'request_object_encryption_enc_values_supported',
    'token_endpoint_auth_methods_supported',
    'token_endpoint_auth_signing_alg_values_supported',
    'display_values_supported',
    'claim_types_supported',
    'claims_supported',
    'service_documentation',
    'claims_locales_supported',
    'ui_locales_supported',
    'claims_parameter_supported',
    'request_parameter_supported',
    'request_uri_parameter_supported',
    'require_request_uri_registration',
    'op_policy_uri',
    'op_tos_uri',
    'check_session_iframe',
    'end_session_endpoint'
  ]

  /**
   * Build Provider Configuration Info from Metadata
   */

  server.OpenIDConfiguration = parameters.reduce(function (config, param) {
    const value = settings[param]
    if (value) { config[param] = value }
    return config
  }, {})
}
