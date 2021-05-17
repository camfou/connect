const User = require('../models/User')
const { KeyGen } = require('../lib/keygen')

/**
 * Check if server is in out-of-box mode
 */
function isOOB (cb) {
  User.listByRoles('authority', function (err, users) {
    if (err) {
      return cb(err)
    }
    // return true if there are no authority users
    return cb(null, !users || !users.length)
  })
}

exports.isOOB = isOOB

exports.readSetupToken = (cb) => {
  try {
    const keyGen = new KeyGen()
    cb(null, keyGen.getSetupToken())
  } catch (err) {
    cb(err)
  }
}
