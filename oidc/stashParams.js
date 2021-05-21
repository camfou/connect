/**
 * Stash authorization params
 */

function stashParams (req, res, next) {
  const params = JSON.stringify(req.connectParams)
  const id = Buffer.from(params).toString('base64')
  req.session.state = id
  req.authorizationId = id
  next()
}

/**
 * Exports
 */

module.exports = stashParams
