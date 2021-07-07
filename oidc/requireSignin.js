/**
 * Module dependencies
 */

const qs = require('qs')
const sessionState = require('./sessionState')

/**
 * Require signin
 */

function requireSignin (req, res, next) {
  const params = req.connectParams
  const prompt = params.prompt
  const responseMode = (params.response_mode && params.response_mode.trim()) ||
    (params.response_type.trim() === 'code' ||
      params.response_type.trim() === 'none')
    ? '?'
    : '#'

  // redirect with error if unauthenticated
  // and prompt is "none"
  if (!req.user && prompt === 'none') {
    res.redirect(req.connectParams.redirect_uri + responseMode + qs.stringify({
      error: 'login_required',
      state: req.connectParams.state,
      session_state: sessionState(req.client, req.client.client_uri, req.session.opbs)
    }))

  // prompt to signup
  } else if (!req.user && prompt === 'signup') {
    res.redirect('/signup?' + qs.stringify(req.connectParams))
  // prompt to sign in
  } else if (!req.user || prompt === 'login') {
    res.redirect('/signin?' + qs.stringify(req.connectParams))

  // do not prompt to sign in
  } else {
    next()
  }
}

/**
 * Exports
 */

module.exports = requireSignin
