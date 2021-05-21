const MissingStateError = require('../errors/MissingStateError')

/**
 * Unstash authorization params
 */

function unstashParams (req, res, next) {
  // OAuth 2.0 callbacks should have a state param
  // OAuth 1.0 must use the session to store the state value
  const base64state = req.query.state || req.session.state
  if (!base64state) { // && request is OAuth 2.0
    return next(new MissingStateError())
  }
  const params = Buffer.from(base64state, 'base64').toString('ascii')
  req.connectParams = JSON.parse(params)
  next()
}

/**
 * Exports
 */

module.exports = unstashParams
