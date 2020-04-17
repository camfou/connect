# Test dependencies
_ = require 'lodash'
chai = require 'chai'
sinon = require 'sinon'
sinonChai = require 'sinon-chai'
expect = chai.expect
proxyquire = require('proxyquire').noCallThru()
superagent = require 'superagent'
version = require('../../../../package').version

# Assertions
chai.use sinonChai
chai.should()


# Code under test
User = proxyquire('../../../../models/User', {
  '../boot/redis': {
    getClient: () => {}
  }
})
OAuth2Strategy = proxyquire('../../../../protocols/OAuth2', {
  '../models/User': User
})
providers = require '../../../../providers'


# We need to test two things.
#   1. That the request is being formed correctly given the
#      properties of a provider and client. For this we'll
#      return a superagent request object to assert against.
#   2. That the response is handled correctly. For this we'll
#      use `nock`, to mock the HTTP service in question.
sandbox = sinon.createSandbox()

describe 'OAuth2Strategy authorizationCodeGrant', ->
  { err, res, provider, client, strategy } = {}
  before () ->
    sandbox.stub(superagent, 'post')
    sandbox.stub(superagent, 'patch')

  after ()->
    sandbox.restore()

  describe 'with defaults and valid parameters', ->
    postStub = {
      set: sinon.stub(),
      send: sinon.stub(),
      end: sinon.stub().callsArgWith(0, null, {})
    }
    before (done) ->
      superagent.post.returns(postStub)
      provider = _.clone providers.oauth2test, true
      client =
        client_id: 'uuid', client_secret: 'h4sh'
      verifier = () ->
      strategy = new OAuth2Strategy provider, client, verifier
      strategy.authorizationCodeGrant 'r4nd0m', () ->
        done()

    it 'should use the specified endpoint', ->
      superagent.post.should.be.calledOnce.and.calledWith(provider.endpoints.token.url)

    it 'should send the grant_type', ->
      postStub.send.should.be.calledOnce.and.calledWith('grant_type=authorization_code&code=r4nd0m&redirect_uri=' + encodeURIComponent(provider.redirect_uri))

    it 'should set the accept header', ->
      postStub.set.should.be.calledWith('accept', 'application/json')

    it 'should set the user agent', ->
      postStub.set.should.be.calledWith('user-agent', 'Anvil Connect/' + version)

  describe 'with custom method', ->
    patchStub = {
      set: sinon.stub(),
      send: sinon.stub(),
      end: sinon.stub().callsArgWith(0, null, {})
    }
    before (done) ->
      superagent.patch.returns(patchStub)
      provider = _.clone providers.oauth2test, true
      provider.endpoints.token.method = 'PATCH'
      client =
        client_id: 'uuid', client_secret: 'h4sh'
      verifier = () ->
      strategy = new OAuth2Strategy provider, client, verifier

      strategy.authorizationCodeGrant 'r4nd0m', () ->
        done()

    it 'should use the correct HTTP method', ->
      expect(superagent.patch).to.be.calledOnce


  describe 'with "client_secret_basic" auth', ->
    postStub = {
      set: sinon.stub(),
      send: sinon.stub(),
      end: sinon.stub().callsArgWith(0, null, {})
    }
    before (done) ->
      superagent.post.returns(postStub)
      provider = _.clone providers.oauth2test, true
      # Specifically setting the method, was getting holdover from other tests.
      provider.endpoints.token.method = 'post'
      provider.endpoints.token.auth = 'client_secret_basic'
      client =
        client_id: 'uuid', client_secret: 'h4sh'
      verifier = () ->
      strategy = new OAuth2Strategy provider, client, verifier

      strategy.authorizationCodeGrant 'r4nd0m', () ->
        done()

    it 'should set the Authorization header', ->
      postStub.set.should.be.calledWith('Authorization', 'Basic ' + strategy.base64credentials())


  describe 'with "client_secret_post" auth', ->
    postStub = {
      set: sinon.stub(),
      send: sinon.stub(),
      end: sinon.stub().callsArgWith(0, null, {})
    }
    before (done) ->
      superagent.post.returns(postStub)
      provider = _.clone providers.oauth2test, true
      provider.endpoints.token.auth = 'client_secret_post'
      client =
        client_id: 'uuid', client_secret: 'h4sh'
      verifier = () ->
      strategy = new OAuth2Strategy provider, client, verifier

      strategy.authorizationCodeGrant 'r4nd0m', () ->
        done()

    it 'should send the client_id', ->
      postStub.send.should.be.calledOnce.and.calledWith('grant_type=authorization_code&code=r4nd0m&redirect_uri=http%3A%2F%2Flocalhost%3A3000connect%2Foauth2test%2Fcallback&client_id=' + client.client_id + '&client_secret=' + client.client_secret)

  describe 'with error response', ->
    postStub = {
      set: sinon.stub(),
      send: sinon.stub(),
      end: sinon.stub().callsArgWith(0, new Error())
    }
    before (done) ->
      superagent.post.returns(postStub)
      provider = _.clone providers.oauth2test, true
      client =
        client_id: 'uuid', client_secret: 'h4sh'
      verifier = () ->
      strategy = new OAuth2Strategy provider, client, verifier

      strategy.authorizationCodeGrant 'r4nd0m', (error, response) ->
        err = error
        res = response
        done()

    it 'should provide an error', ->
      expect(err).to.be.an('Error')

    it 'should not provide a token response', ->
      expect(res).to.be.undefined


  describe 'with "x-www-form-urlencoded" response', ->
    postStub = {
      set: sinon.stub(),
      send: sinon.stub(),
      end: sinon.stub().callsArgWith(0, null, {
        text: 'access_token=t0k3n&expires=3600',
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        statusCode: 200
      })
    }
    before (done) ->
      superagent.post.returns(postStub)
      provider = _.clone providers.oauth2test, true
      provider.endpoints.token.parser = 'x-www-form-urlencoded'
      client =
        client_id: 'uuid', client_secret: 'h4sh'
      verifier = () ->
      strategy = new OAuth2Strategy provider, client, verifier

      strategy.authorizationCodeGrant 'r4nd0m', (error, response) ->
        err = error
        res = response
        done()

    it 'should not provide an error', ->
      expect(err).to.be.null

    it 'should provide the token response', ->
      res.access_token.should.equal 't0k3n'
      res.expires.should.equal '3600'


  describe 'with "JSON" response', ->
    postStub = {
      set: sinon.stub(),
      send: sinon.stub(),
      end: sinon.stub().callsArgWith(0, null, {
        body: { access_token: 'h3x' },
        statusCode: 200
      })
    }
    before (done) ->
      superagent.post.returns(postStub)
      provider = _.clone providers.oauth2test, true
      provider.endpoints.token.parser = 'json'
      client =
        client_id: 'uuid', client_secret: 'h4sh'
      verifier = () ->
      strategy = new OAuth2Strategy provider, client, verifier

      strategy.authorizationCodeGrant 'r4nd0m', (error, response) ->
        err = error
        res = response
        done()

    it 'should not provide an error', ->
      expect(err).to.be.null

    it 'should provide the token response', ->
      res.access_token.should.equal 'h3x'




