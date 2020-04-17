# Test dependencies
_ = require 'lodash'
chai = require 'chai'
sinon = require 'sinon'
sinonChai = require 'sinon-chai'
expect = chai.expect
proxyquire = require('proxyquire').noCallThru()

# Assertions
chai.use sinonChai
chai.should()


# Code under test
providers = require '../../../../providers'
User = proxyquire('../../../../models/User', {
  '../boot/redis': {
    getClient: () => {}
  }
})
OAuthStrategy = proxyquire('../../../../protocols/OAuth', {
  '../models/User': User
})

describe 'OAuthStrategy resourceOwnerAuthorization', ->
  { token, provider, strategy } = {}

  beforeEach ->
    token = 't0k3n'
    provider = _.clone providers.oauthtest, true
    client = {}
    verifier = () ->
    strategy = new OAuthStrategy provider, client, verifier
    strategy.redirect = sinon.spy()
    strategy.resourceOwnerAuthorization(token)

  it 'should redirect', ->
    url = provider.endpoints.authorization.url
    strategy.redirect.should.have.been.calledWith sinon.match(url)

  it 'should include oauth_token', ->
    strategy.redirect.should.have.been.calledWith sinon.match(
      'oauth_token=' + token
    )




