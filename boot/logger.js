/**
 * Module dependencies
 */

const cwd = process.cwd()
const env = process.env.NODE_ENV || 'development'
const path = require('path')
const bunyan = require('express-bunyan-logger')
const ensureWritableDirectory = require('../lib/fs-utils').ensureWritableDirectory
const oidc = require('../oidc')

const FN_ARGS_SPLIT = /^[^(]*\(\s*([^)]*)\)/m

/**
 * Returns a given function's parameter list in string form.
 * E.g. 'req, res, next' for a middleware function.
 */

function getParams (fn) {
  return fn.toString().match(FN_ARGS_SPLIT)[1]
}

/**
 * Adds logging to Anvil by looping through the applicable Anvil modules
 * and injecting any function whose parameter list matches the parameter
 * list of the given addLogging function into the addLogging function where
 * it will be executed along with the embedded log statement.
 *
 * Applicable modules have an index.js which contains the module's
 * functions. The module's functions are iterated through shallowly, nested
 * functions cannot be matched against. The functions should be named
 * rather than anonymous to improve the logging output.
 *
 * Currently only the oidc module is applicable.
 */

function addLoggingAnvil (addLogging) {
  function addLoggingModule (module) {
    for (const idx in module) {
      const fn = module[idx]
      if (getParams(fn) === addLogging.params) {
        // wrap function with logging
        module[fn.name] = addLogging(fn)
      }
    }
  }
  addLoggingModule(oidc)
}

/**
 * For each log level that has been implemented, a function has been added
 * below containing the desired logging statement, the original function
 * call (either before or after as desired). This function accepts a 'fn'
 * param which is a function (with matching parameter list) it will wrap.
 */

function addDebugLogging () {
  const addLogging = function (fn) {
    return function (req, res, next) {
      req.log.debug(fn.name)
      fn(req, res, next)
    }
  }
  addLogging.params = 'req, res, next'
  addLoggingAnvil(addLogging)
}

function addErrorLogging () {
  const addLogging = function (fn) {
    return function (err, req, res, next) {
      req.log.error(err, fn.name)
      fn(err, req, res, next)
    }
  }
  addLogging.params = 'err, req, res, next'
  addLoggingAnvil(addLogging)
}

/**
 * Export
 */

module.exports = function (options) {
  let config = { name: 'request', streams: [], level: 'info', obfuscate: ['body.password'] }

  if (!env.match(/test/i)) {
    const logsPath = path.join(cwd, 'logs')
    ensureWritableDirectory(logsPath)

    if (options && options.stdout) { config.streams.push({ stream: process.stdout }) }
    if (options && options.file) { config.streams.push({ path: path.join(logsPath, env + '.log') }) }
    if (options && options.level) { config.level = options.level }

    switch (config.level) {
      case 'fatal':
        break
      case 'error':
        addErrorLogging()
        break
      case 'warn':
        addErrorLogging()
        break
      case 'info':
        addErrorLogging()
        break
      case 'debug':
        addDebugLogging()
        addErrorLogging()
        break
      case 'trace':
        addDebugLogging()
        addErrorLogging()
        break
    }

    try {
      config = require(path.join(cwd, 'logger'))
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND') { throw e }
    }
  }

  const logger = bunyan(config)

  module.exports = logger
  return logger
}
