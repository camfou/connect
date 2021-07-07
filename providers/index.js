/* global process, __dirname */

/**
 * Module dependencies
 */

const fs = require('fs')
const _ = require('lodash')
const cwd = process.cwd()
const path = require('path')
const settings = require('../boot/settings')
const defaultDirectory = __dirname
const customDirectory = path.join(cwd, 'providers')

function loadProvider (dir, name, template) {
  return require(
    template
      ? path.join(dir, 'templates', name)
      : path.join(dir, name)
  )
}

// Hold on to whatever templates are found in order to avoid unecessary filesystem
// accesses
const templateCache = {}

/**
 * Load providers
 */
function loadProviders (dir, files) {
  files.forEach(function (file) {
    if (path.extname(file) === '.js' && file !== 'index.js') {
      const providerName = path.basename(file, '.js')

      try {
        // Grab the provider from the given directory
        let provider = loadProvider(dir, providerName)(settings)

        // Check if the provider extends any templates
        if (Array.isArray(provider.templates) && provider.templates.length) {
          const templates = []
          let templateName
          // Iterate through the provider's templates, load them, and store them
          // in memory in case we run into them again later
          for (let i = 0; i < provider.templates.length; i++) {
            templateName = provider.templates[i]
            if (!templateCache[templateName]) {
              try {
                templateCache[templateName] = loadProvider(
                  customDirectory, templateName, true
                )
              } catch (err) {
                templateCache[templateName] = loadProvider(
                  defaultDirectory, templateName, true
                )
              }
            }
            // If the provider has any specific configuration to pass to the template,
            // send it along with the settings to the function call
            if (provider.templateConfig && provider.templateConfig[templateName]) {
              templates.push(templateCache[templateName](
                settings, provider.templateConfig[templateName]
              ))
            } else {
              templates.push(templateCache[templateName](settings))
            }
          }
          // Go bottom-up through the list of generated template instances and
          // build up the base provider, then extend the base provider with the
          // top-most provider. Effectively, the result is a provider with the
          // proper order of inheritance for the templates it extends.
          const base = templates[templates.length - 1]
          for (let i = templates.length - 2; i >= 0; i--) {
            _.extend(base, templates[i])
          }
          _.extend(base, provider)

          provider = base
        }

        provider.emailVerification = _.extend(
          { enable: !!settings.mailer, require: false },
          settings.emailVerification || {},
          (settings.providers[providerName] &&
          settings.providers[providerName].emailVerification) || {}
        )

        if (settings.providers[providerName]) {
          // override the daysToCrack setting for the password provider
          const odays = settings.providers[providerName].daysToCrack
          if (typeof odays !== 'undefined') {
            provider.daysToCrack = odays
          }

          // override the default amr for the provider
          const oamr = settings.providers[providerName].amr
          if (typeof oamr !== 'undefined') {
            provider.amr = oamr
          }

          // provider-specific refresh_userinfo setting
          const orefuserInfo = settings.providers[providerName].refresh_userinfo
          if (typeof orefuserInfo !== 'undefined') {
            provider.refresh_userinfo = orefuserInfo
          }
        }

        module.exports[providerName] = provider
      } catch (e) {
        throw new Error("Can't load " + providerName + ' provider.')
      }
    }
  })
}

try {
  loadProviders(defaultDirectory, fs.readdirSync(defaultDirectory))
} catch (e) {}

try {
  loadProviders(customDirectory, fs.readdirSync(customDirectory))
} catch (e) {}
