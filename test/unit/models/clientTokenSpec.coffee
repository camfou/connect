# Test dependencies
cwd         = process.cwd()
path        = require 'path'
chai        = require 'chai'
sinon       = require 'sinon'
sinonChai   = require 'sinon-chai'
expect      = chai.expect




# Assertions
chai.use sinonChai
chai.should()




# Code under test
ClientToken = require path.join cwd, 'models/ClientToken'
base64url = require 'base64url'
settings = require path.join cwd, 'boot/settings'




describe 'Client Token', ->
  describe 'issue', ->
    {err,jwt} = {}
    privateKey = settings.keys.sig.prv

    describe 'with valid claims', ->
      before (done) ->
        ClientToken.issue {
          iss: 'http://anvil.io'
          sub: 'uuid'
          aud: 'uuid'
        }, privateKey, (error, encoded) ->
          err = error
          jwt = encoded
          done()

      it 'should provide a null error', ->
        expect(err).to.be.null

      it 'should provide an encoded JWT', ->
        jwt.should.contain '.'

    describe 'with invalid claims', ->
      before (done) ->
        ClientToken.issue {}, privateKey, (error, encoded) ->
          err = error
          jwt = encoded
          done()

      it 'should provide an error', ->
        expect(err).to.be.instanceof Error

      it 'should not provide an encoded jwt', ->
        expect(jwt).to.be.undefined
