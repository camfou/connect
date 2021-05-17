const { KeyGen } = require('../lib/keygen')

let keys
try {
  const keyGen = new KeyGen()

  keys = keyGen.getKeys()
} catch (e) {
  console.log(e)
  process.exit(1)
}
/**
 * Export
 */
module.exports = keys
