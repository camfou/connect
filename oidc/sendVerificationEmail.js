/**
 * Module dependencies
 */
const { URL } = require('url')
const mailer = require('../boot/mailer')
const settings = require('../boot/settings')
const OneTimeToken = require('../models/OneTimeToken')

/**
 * Send verification email middleware
 */

function sendVerificationEmail (req, res, next) {
  // skip if we don't need to send the email
  if (!req.sendVerificationEmail) {
    next()

    // send the email
  } else {
    const user = req.user

    const ttl = (settings.emailVerification &&
      settings.emailVerification.tokenTTL) ||
      (3600 * 24 * 7)

    OneTimeToken.issue({
      ttl: ttl,
      sub: user._id,
      use: 'emailVerification'
    }, function (err, token) {
      if (err) { return next(err) }

      // build email link
      const verifyURL = new URL(settings.issuer)
      verifyURL.pathname = 'email/verify'
      verifyURL.searchParams.set('token', token._id)
      ;['redirect_uri', 'client_id', 'response_type', 'scope', 'nonce']
        .forEach(function (key) {
          const value = req.connectParams[key]
          if (value) {
            verifyURL.searchParams.set(key, value)
          }
        })

      // email template data
      const locals = {
        email: user.email,
        name: {
          first: user.givenName,
          last: user.familyName
        },
        verifyURL: verifyURL.toString()
      }

      // Send verification email
      mailer.getMailer().sendMail('verifyEmail', locals, {
        to: user.email,
        subject: 'Verify your e-mail address'
      }, function (err, responseStatus) {
        // eslint-disable-next-line no-empty
        if (err) { }
        // TODO: REQUIRES REFACTOR TO MAIL QUEUE
        next()
      })
    })
  }
}

/**
 * Export
 */

module.exports = sendVerificationEmail
