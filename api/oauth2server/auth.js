/**
 * Module dependencies.
 */
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , BasicStrategy = require('passport-http').BasicStrategy
  , ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy
  , BearerStrategy = require('passport-http-bearer').Strategy
  , db = require('./db');
var scrypt = require("scrypt");

/**
 * LocalStrategy
 *
 * This strategy is used to authenticate users based on a username and password.
 * Anytime a request is made to authorize an application, we must ensure that
 * a user is logged in before asking them to approve the request.
 */
passport.use(new LocalStrategy(
  function(username, password, done) {
      console.log('in local strategy:' + username);
    db.users.findByUsername(username, function(err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (!scrypt.verifyKdfSync(new Buffer(user.password, 'base64'), password)) { return done(null, false); }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  db.users.find(id, function (err, user) {
    done(err, user);
  });
});


/**
 * BasicStrategy & ClientPasswordStrategy
 *
 * These strategies are used to authenticate registered OAuth clients.  They are
 * employed to protect the `token` endpoint, which consumers use to obtain
 * access tokens.  The OAuth 2.0 specification suggests that clients use the
 * HTTP Basic scheme to authenticate.  Use of the client password strategy
 * allows clients to send the same credentials in the request body (as opposed
 * to the `Authorization` header).  While this approach is not recommended by
 * the specification, in practice it is quite common.
 */
//client secret is base64 encoded before giving to client

passport.use(new BasicStrategy(
  function(username, password, done) {
    console.log("in BasicStrategy (username: " + username + ", password: " + password + ");");
    db.clients.findByClientId(username, function(err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      if (!scrypt.verifyKdfSync(new Buffer(client.clientSecret, 'base64'), new Buffer(password, 'base64'))) { return done(null, false); }
      return done(null, client);
    });
  }
));

passport.use(new ClientPasswordStrategy(
  function(clientId, clientSecret, done) {
    console.log('in ClientPasswordStrategy( clientId:' + clientId + ', clientSecret:' + clientSecret + ')');
    db.clients.findByClientId(clientId, function(err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      if (!scrypt.verifyKdfSync(new Buffer(client.clientSecret, 'base64'), new Buffer(clientSecret, 'base64'))) { return done(null, false); }
      return done(null, client);
    });
  }
));

/**
 * BearerStrategy
 *
 * This strategy is used to authenticate either users or clients based on an access token
 * (aka a bearer token).  If a user, they must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 */
passport.use(new BearerStrategy(
  function(accessToken, done) {
    console.info('in Bearer Strategy (access_token: ' + accessToken + ')');
    db.accessTokens.find(accessToken, function(err, token) {
      if (err) { return done(err); }
      if (!token) { return done(null, false); }
      console.info("token found (" + JSON.stringify(token) + ")");
      if(token.userId != null) {
          db.users.find(token.userId, function(err, user) {
              if (err) { return done(err); }
              if (!user) { return done(null, false); }
              // to keep this example simple, restricted scopes are not implemented,
              // and this is just for illustrative purposes
              var info = { scope: token.scopes };
              done(null, user, info);
          });
      } else {
          //The request came from a client only since userID is null
          //therefore the client is passed back instead of a user
          db.clients.findByClientId(token.clientId, function(err, client) {
             if(err) { return done(err); }
              if(!client) { return done(null, false); }
              // to keep this example simple, restricted scopes are not implemented,
              // and this is just for illustrative purposes
              var info = { scope: token.scopes };
              done(null, client, info);
          });
      }
    });
  }
));
