/* global process, __dirname */

/**
 * Module dependencies
 */

const nodemailer = require('nodemailer')
const settings = require('./settings')
const cons = require('consolidate')
const htmlToText = require('html-to-text')
const path = require('path')
const templatesDir = path.resolve(process.cwd(), 'email')
const origTemplatesDir = path.resolve(__dirname, '..', 'email')
let engine, engineName, defaultFrom

/**
 * Render e-mail templates to HTML and text
 */

function render (template, locals, callback) {
  const engineExt =
  engineName.charAt(0) === '.' ? engineName : ('.' + engineName)
  const tmplPath = path.join(templatesDir, template + engineExt)
  const origTmplPath = path.join(origTemplatesDir, template + engineExt)

  function renderToText (html) {
    const text = htmlToText.fromString(html, {
      wordwrap: 72 // A little less than 80 characters per line is the de-facto
    // standard for e-mails to allow for some room for quoting
    // and e-mail client UI elements (e.g. scrollbar)
    })

    callback(null, html, text)
  }

  engine(tmplPath, locals)
    .then(renderToText)
    .catch(function () {
      engine(origTmplPath, locals)
        .then(renderToText)
        .catch(function (err) {
          callback(err)
        })
    })
}

/**
 * Helper function to send e-mails using templates
 */

function sendMail (template, locals, options, callback) {
  const self = this
  this.render(template, locals, function (err, html, text) {
    if (err) { return callback(err) }

    self.transport.sendMail({
      from: options.from || defaultFrom,
      to: options.to,
      bcc: options.bcc,
      subject: options.subject,
      html: html,
      text: text
    }, callback)
  })
}

/**
 * Get mailer
 */

let mailer

exports.getMailer = function () {
  if (mailer) {
    return mailer
  } else {
    const fromVerifier = /^(?:\w|\s)+<[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}>$/igm
    const transport = settings.mailer &&
      nodemailer.createTransport(settings.mailer)

    engineName = (settings.mailer && settings.mailer.view_engine) ||
      settings.view_engine ||
      'hogan'
    engine = cons[engineName]

    if (transport && (typeof settings.mailer.from !== 'string' ||
      !fromVerifier.test(settings.mailer.from))) {
      console.error(settings.mailer.from)
      throw new Error('From field not provided for mailer. ' +
        'Expected "Display Name <email@example.com>"')
    }

    defaultFrom = settings.mailer && settings.mailer.from

    mailer = {
      from: defaultFrom,
      render: render,
      transport: transport,
      sendMail: sendMail
    }

    return mailer
  }
}
