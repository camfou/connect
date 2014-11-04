/**
 * Module dependencies
 */

var pkg = require('../../package.json')
  , agent = 'Anvil Connect/' + pkg.version
  , URL = require('url')
  , util = require('util')
  , Strategy = require('passport-strategy')
  , request = require('superagent')
  , FormUrlencoded = require('form-urlencoded')
  , map = require('../../node_modules/modinha/lib/initialize').map
  ;


/**
 * OAuth2Strategy
 */

function OAuth2Strategy (provider, client, verify) {
  Strategy.call(this);
  this.provider   = provider;
  this.endpoints  = provider.endpoints;
  this.mapping    = provider.mapping;
  this.client     = client;
  this.name       = provider.id;
  this.verify     = verify;
}

util.inherits(OAuth2Strategy, Strategy);


/**
 * Authenticate
 */

function authenticate (req, options) {
  var strategy = this
    , error    = req.query && req.query.error
    , code     = req.query && req.query.code
    , options  = options || {}
    ;

  // Handle authorization endpoint error
  if (error) {
    // handle error response
  }

  // Handle token response
  if (code) {
    // exchange the code for an access token
    strategy.authorizationCodeGrant(code, function (err, response) {
      if (err) {}

      // request user info
      strategy.userInfo(response.access_token, function (err, profile) {
        if (err) {}

        // invoke the callback
        strategy.verify(req, response, profile, function (err, user, info) {
          if (err)   { return strategy.error(err); }
          if (!user) { return strategy.fail(info); }
          strategy.success(user, info);
        });
      });
    });
  }

  // Initiate the OAuth 2.0 Authorization Code Flow
  else {
    strategy.authorizationRequest(options);
  }
}

OAuth2Strategy.prototype.authenticate = authenticate;


/**
 * Base64 Credentials
 *
 * Base64 encodes the user:password value for an HTTP Basic Authorization
 * header from a provider configuration object. The provider object should
 * specify a client_id and client_secret.
 */

function base64credentials () {
  var id          = this.client.client_id
    , secret      = this.client.client_secret
    , credentials = id + ':' + secret
    ;

  return new Buffer(credentials).toString('base64');
}

OAuth2Strategy.prototype.base64credentials = base64credentials;


/**
 * Authorization Request
 */

function authorizationRequest (options) {
  var provider      = this.provider
    , endpoints     = this.endpoints
    , config        = this.client
    , url           = URL.parse(endpoints.authorize.url)
    , response_type = 'code'
    , client_id     = config.client_id
    , redirect_uri  = provider.redirect_uri
    ;

  // required authorization parameters
  url.query = {
    response_type:  response_type,
    client_id:      client_id,
    redirect_uri:   redirect_uri,
  };

  // merge default and configured scopes
  if (provider.scope || config.scope) {
    var s1 = provider.scope || []
      , s2 = config.scope   || []
      , sp = provider.separator
      ;

    url.query.scope = s1.concat(s2).join(sp);
  }

  // redirect to the provider
  this.redirect(URL.format(url))
}

OAuth2Strategy.prototype.authorizationRequest = authorizationRequest;


/**
 * Authorization Code Grant Request
 */

function authorizationCodeGrant (code, done) {
  var endpoint = this.endpoints.token
    , url      = endpoint.url
    , method   = endpoint.method.toLowerCase()
    , auth     = endpoint.auth
    ;

  // required token parameters
  var params = {};
  params.grant_type   = 'authorization_code';
  params.code         = code;
  params.redirect_uri = this.provider.redirect_uri;

  var req = request[method](url);

  if (auth === 'client_secret_basic') {
    req.set('Authorization', 'Basic ' + this.base64credentials());
  }

  if (auth === 'client_secret_post') {
    params.client_id = this.client.client_id;
    params.client_secret = this.client.client_secret;
  }

  req.send(FormUrlencoded.encode(params));
  req.set('accept', 'application/json');
  req.set('user-agent', agent)

  req.end(function (res) {
    done(null, res.body);
  });
}

OAuth2Strategy.prototype.authorizationCodeGrant = authorizationCodeGrant;


/**
 * User Info
 */

function userInfo (token, done) {
  var name     = this.name
    , endpoint = this.endpoints.user
    , mapping  = this.mapping
    , url      = endpoint.url
    , method   = endpoint.method.toLowerCase()
    , auth     = endpoint.auth
    ;

  var req = request[method](url);

  if (auth === 'bearer_token') {
    req.set('Authorization', 'Bearer ' + token);
  }

  if (auth === 'access_token') {
    req.query({
      access_token: token
    });
  }

  req.set('accept', 'application/json');
  req.set('user-agent', agent);

  req.end(function (res) {
    if (res.statusCode === 401) {
      //return done(new Error('Unauthorized.'))
    }

    var profile = { provider: name }
    map(mapping, res.body, profile)
    done(null, profile);
  });
}

OAuth2Strategy.prototype.userInfo = userInfo;


/**
 * Exports
 */

module.exports = OAuth2Strategy;