const fs = require('fs-extra')
const { join, dirname } = require('path')
const { JWK, generateJwks } = require('@tsed/jwks')
const crypto = require('crypto')

class Keygen {
  constructor (directory) {
    // base directory for keys to be read from and written to
    this.directory = join(directory || process.cwd(), 'keys')

    // signature key pair file paths
    this.sig = {
      pub: join(this.directory, 'sig.rsa.pub.pem'),
      prv: join(this.directory, 'sig.rsa.prv.pem')
    }

    // encryption key pair file paths
    this.enc = {
      pub: join(this.directory, 'enc.rsa.pub.pem'),
      prv: join(this.directory, 'enc.rsa.prv.pem')
    }

    // setup token
    this.setup = join(this.directory, 'setup.token')
  }

  generateKeyPairs () {
    const sigKeys = JWK.generateSync('RSA', 4096, { use: 'sig' })
    fs.ensureDirSync(dirname(this.sig.pub))

    fs.writeFileSync(this.sig.prv, sigKeys.toPEM(true))
    fs.writeFileSync(this.sig.pub, sigKeys.toPEM(false))

    const encKeys = JWK.generateSync('RSA', 4096, { use: 'sig' })
    fs.writeFileSync(this.enc.prv, encKeys.toPEM(true))
    fs.writeFileSync(this.enc.pub, encKeys.toPEM(false))
  }

  loadKeyPairs () {
    const jwks = generateJwks({
      certificates: [
        { path: this.sig.pub, alg: 'RS256', use: 'sig', kid: 'key-0' },
        { path: this.enc.pub, alg: 'RS256', use: 'enc', kid: 'key-1' }
      ]
    })

    return {
      sig: {
        pub: fs.readFileSync(this.sig.pub, { encoding: 'utf8' }),
        prv: fs.readFileSync(this.sig.prv, { encoding: 'utf8' })
      },
      enc: {
        pub: fs.readFileSync(this.enc.pub, { encoding: 'utf8' }),
        prv: fs.readFileSync(this.enc.prv, { encoding: 'utf8' })
      },
      jwks
    }
  }

  loadSetupToken () {
    return fs.readFileSync(this.setup, { encoding: 'utf8' }).toString().trim()
  }

  generateSetupToken () {
    fs.ensureDirSync(dirname(this.setup))

    const token = crypto.randomBytes(256).toString('hex')
    try {
      fs.writeFileSync(this.setup, token, 'utf8')
    } catch (e) {
      throw new Error(`Unable to save setup token to ${this.setup}`)
    }
    return token
  }

  getSetupToken () {
    try {
      // try to read setup token from filesystem
      const token = this.loadSetupToken()
      // if token is blank, try to generate a new token and save it
      if (token) {
        return token
      }
    } catch (err) {
    }

    return this.generateSetupToken()
  }

  getKeys () {
    const exists = fs.existsSync(this.sig.pub)

    if (!exists) {
      this.generateKeyPairs()
    }

    return this.loadKeyPairs()
  }
}

exports.KeyGen = Keygen
