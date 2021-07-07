/**
 * Module dependencies
 */

const client = require('../boot/redis').getClient()

/**
 * Check session
 */

function checkSession (req, res, next) {
  let initialOpbs = req.session.opbs

  function compareOpbs () {
    client.get('sess:' + req.sessionID, function (err, data) {
      if (err) { return next(err) }
      if (data) {
        try {
          const opbs = JSON.parse(data).opbs
          if (opbs !== initialOpbs) {
            res.write('event: update\n')
            res.write('data: ' + opbs + '\n\n')
            initialOpbs = opbs
          }
        } catch (e) {}
      }

      setTimeout(function () {
        compareOpbs()
      }, 3000)
    })
  }
  compareOpbs()
}

/**
 * Export
 */

module.exports = checkSession
