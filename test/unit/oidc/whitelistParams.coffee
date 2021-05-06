chai      = require 'chai'
sinon     = require 'sinon'
sinonChai = require 'sinon-chai'
expect    = chai.expect




chai.use sinonChai
chai.should()



settings = require '../../../boot/settings'
whitelistParams = require '../../../oidc/whitelistParams'


whitelist_params = settings.whitelist_request_params

describe 'Whitelist Params', ->


  {req,res,next} = {}

  before ->
    settings.whitelist_request_params = ['ga', 'utm_source']

  after ->
    settings.whitelist_request_params = whitelist_params

  describe 'with whitelisted and unknown params', ->

    before ->
      req = {
        connectParams: {
          ga: 'gaValue'
          utm_source: 'utm_sourceValue'
          random_key: 'random_keyValue'
        }
      }
      res = {}
      next = sinon.spy()
      whitelistParams req, res, next

    it 'should put in req.whitelistParams only whitelisted key values', ->
      req.whitelistParams.should.deep.equal {
        ga: 'gaValue'
        utm_source: 'utm_sourceValue'
      }

    it 'should not change the request connectParams', ->
      req.connectParams.should.deep.equal {
        ga: 'gaValue'
        utm_source: 'utm_sourceValue'
        random_key: 'random_keyValue'
      }

    it 'should continue', ->
      next.should.have.been.called




  describe 'without whitlisted params', ->

    before ->
      req = { connectParams: { random_key: 'random_keyValue' } }
      res = {}
      next = sinon.spy()
      whitelistParams req, res, next

    it 'should default req.whitelistParams to empty object', ->
      req.whitelistParams.should.deep.equal {}

    it 'should not change the request connectParams', ->
      req.connectParams.should.deep.equal {
        random_key: 'random_keyValue'
      }

    it 'should continue', ->
      next.should.have.been.called


