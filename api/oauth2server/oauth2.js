/**
 * Module dependencies.
 */
var oauth2orize = require('oauth2orize')
  , passport = require('passport')
  , login = require('connect-ensure-login')
  , db = require('./db')
  , utils = require('./utils')
  , scrypt = require('scrypt');

// create OAuth 2.0 server
var server = oauth2orize.createServer();
var ttl = 3600 * 24 * 30; //made their access_token valid for 30 days

// Register serialialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// may involve multiple HTTP request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session.  Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.

server.serializeClient(function(client, done) {
  return done(null, client.id);
});

server.deserializeClient(function(id, done) {
  db.clients.find(id, function(err, client) {
    if (err) { return done(err); }
    return done(null, client);
  });
});

// Register supported grant types.
//
// OAuth 2.0 specifies a framework that allows users to grant client
// applications limited access to their protected resources.  It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.

// Grant authorization codes.  The callback takes the `client` requesting
// authorization, the `redirectURI` (which is used as a verifier in the
// subsequent exchange), the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a code, which is bound to these
// values, and will be exchanged for an access token.

server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
  var code = utils.uid(16);

  db.authorizationCodes.save(code, client.id, redirectURI, user.id, function(err) {
    if (err) { return done(err); }
    done(null, code);
  });
}));

// Grant implicit authorization.  The callback takes the `client` requesting
// authorization, the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a token, which is bound to these
// values.

server.grant(oauth2orize.grant.token(function(client, user, ares, done) {
    utils.uid(256, function(err, token){
        if(err){ return done(err);}
        utils.uid(256, function(err, refreshToken){
            if(err){ return done(err);}
            var scope = [];
            var expires = new Date();
            expires.setSeconds(expires.getSeconds() + ttl);

            db.accessTokens.save(token, refreshToken, user.id, client.clientId, scope, expires, function(err) {
                if (err) { return done(err); }
                done(null, token, refreshToken, {scope: scope, expires: expires});
            });
        });
    });
}));

// Exchange authorization codes for access tokens.  The callback accepts the
// `client`, which is exchanging `code` and any `redirectURI` from the
// authorization request for verification.  If these values are validated, the
// application issues an access token on behalf of the user who authorized the
// code.

server.exchange(oauth2orize.exchange.code(function(client, code, redirectURI, done) {
  db.authorizationCodes.find(code, function(err, authCode) {
    if (err) { return done(err); }
    if (authCode === null) { return done(null, false); }
    if (client.id !== authCode.clientID) { return done(null, false); }
    if (redirectURI !== authCode.redirectURI) { return done(null, false); }

    utils.uid(256, function(err, token) {
        if (err) {
            return done(err);
        }
        utils.uid(256, function (err, refreshToken) {
            if (err) {
                return done(err);
            }
            var scope = [];
            var expires = new Date();
            expires.setSeconds(expires.getSeconds() + ttl);

            db.accessTokens.save(token, refreshToken, authCode.userID, authCode.clientID, scope, expires, function (err) {
                if (err) {
                    return done(err);
                }
                done(null, token, refreshToken, {scope: scope, expires: expires});
            });
        });
    });
  });
}));

// Exchange user id and password for access tokens.  The callback accepts the
// `client`, which is exchanging the user's name and password from the
// authorization request for verification. If these values are validated, the
// application issues an access token on behalf of the user who authorized the code.

server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done) {
    console.info(" in password exchange (client:" + JSON.stringify(client) + ", username:" + username + ", password:" + password + ", scope:" + scope + ")");

    //Validate the client
    db.clients.findByClientId(client.clientId, function(err, localClient) {
        console.log('findByClientId:', client.clientId, err, localClient);
        if (err) { return done(err); }
        if(localClient === null) {
            return done(null, false);
        }
        if(localClient.clientSecret !== client.clientSecret) {
            return done(null, false);
        }
        //Validate the user
        db.users.findByUsername(username, function(err, user) {
            console.log('findByUsername', username, err, user);
            if (err) { return done(err); }
            if(user === null) {
                return done(null, false);
            }
            if (!scrypt.verifyKdfSync(new Buffer(user.password, 'base64'), password)) {
                console.log('password verification failed.')
                return done(null, false);
                //return done(new Error('Failed to authenticate'))
            }
            //Everything validated, return the token
            console.log('everything validated return token');
            utils.uid(256, function(err, token) {
                if (err) {
                    return done(err);
                }
                utils.uid(256, function (err, refreshToken) {
                    if (err) {
                        return done(err);
                    }
                    if (typeof scope == 'undefined'){
                        scope = [];
                    }
                    var expires = new Date();
                    expires.setSeconds(expires.getSeconds() + ttl);

                    db.accessTokens.save(token, refreshToken, user.id, client.clientId, scope, expires, function (err) {
                        if (err) {
                            return done(err);
                        } else {
                            return done(null, token, refreshToken, {'scope': scope, 'expires': expires});
                        }
                    });
                });
            });
        });
    });
}));

// Exchange the client id and password/secret for an access token.  The callback accepts the
// `client`, which is exchanging the client's id and password/secret from the
// authorization request for verification. If these values are validated, the
// application issues an access token on behalf of the client who authorized the code.

server.exchange(oauth2orize.exchange.clientCredentials(function(client, scope, done) {
    console.log("in clientCredentials exchange (client:" + client + ", scope:" + scope + ")");

    //Validate the client
    db.clients.findByClientId(client.clientId, function(err, localClient) {
        if (err) { return done(err); }
        if(localClient === null) {
            return done(null, false);
        }
        if(localClient.clientSecret !== client.clientSecret) {
        //if(!scrypt.verifyKdfSync(new Buffer(localClient.clientSecret, 'base64'), new Buffer(client.clientSecret, 'base64'))){
            return done(null, false);
        }

        utils.uid(256, function(err, token) {
            if (err) {
                return done(err);
            }
            utils.uid(256, function (err, refreshToken) {
                if (err) {
                    return done(err);
                }
                //var scope = [];
                var expires = new Date();
                expires.setSeconds(expires.getSeconds() + ttl);
                //Pass in a null for user id since there is no user with this grant type
                db.accessTokens.save(token, refreshToken, null, client.clientId, scope, expires, function (err) {
                    if (err) {
                        return done(err);
                    }
                    done(null, token, refreshToken, {scope: scope, expires: expires});
                });
            });
        });
    });
}));

/*
 * Refresh token exchange
 * https://github.com/IGZangelsanchez/oauth2orize-example-extended/blob/master/server/oauth2.js
 */

server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, done) {
    console.log("* Refresh access token client[", client, "] refreshToken[" + refreshToken + "] scope[" + scope + "]");

    db.accessTokens.findRefresh(refreshToken, function (err, accessTokenToRefresh) {
        console.log('find refresh token err[' + err + '] accessToenToRefresh[' + JSON.stringify(accessTokenToRefresh) + ']');
        if (err) { return done(err); }
        if (accessTokenToRefresh === null) { return done(new Error("Refresh token not found."));}
        // if (accessTokenToRefresh.expires < new Date()) {
        //     return done(new Error("Refresh Token has expired."));
        // }

        console.log("- refresh token valid");

        db.accessTokens.find(accessTokenToRefresh.accessToken, function (err, accessTokenDB) {
            console.log('find accessToken results: err', err, accessTokenDB);
            if (err) { return done(err); }
            if (accessTokenDB == null) {
                return done(new Error("Access Token not found."));
            }
            // if (accessTokenDB.expires < new Date()) {
            //     return done(new Error("Access Token has expired."));
            // }

            console.log("- old access token found");

            utils.uid(256, function(err, token) {
                if (err) {
                    return done(err);
                }
                utils.uid(256, function (err, refreshToken) {
                    if (err) {
                        return done(err);
                    }
                    var expires = new Date();
                    expires.setSeconds(expires.getSeconds() + ttl);

                    db.accessTokens.save(token, refreshToken, accessTokenDB.userId, accessTokenDB.clientId, accessTokenDB.scopes, expires, function (err) {
                        if (err) {
                            return done(err);
                        }

                        console.log("- new access/refresh token saved");

                        db.accessTokens.delete(accessTokenToRefresh.accessToken, function (err) {
                            if (err) {
                                return done(err);
                            }

                            console.log("- old access token deleted");

                            done(null, token, refreshToken, {scope: accessTokenDB.scope, 'expires': expires});
                        });
                    });
                });
            });
        });
    });
}));

// user authorization endpoint
//
// `authorization` middleware accepts a `validate` callback which is
// responsible for validating the client making the authorization request.  In
// doing so, is recommended that the `redirectURI` be checked against a
// registered value, although security requirements may vary accross
// implementations.  Once validated, the `done` callback must be invoked with
// a `client` instance, as well as the `redirectURI` to which the user will be
// redirected after an authorization decision is obtained.
//
// This middleware simply initializes a new authorization transaction.  It is
// the application's responsibility to authenticate the user and render a dialog
// to obtain their approval (displaying details about the client requesting
// authorization).  We accomplish that here by routing through `ensureLoggedIn()`
// first, and rendering the `dialog` view.

exports.authorization = [
  login.ensureLoggedIn(),
  server.authorization(function(clientID, redirectURI, done) {
    db.clients.findByClientId(clientID, function(err, client) {
      if (err) { return done(err); }
      // WARNING: For security purposes, it is highly advisable to check that
      //          redirectURI provided by the client matches one registered with
      //          the server.  For simplicity, this example does not.  You have
      //          been warned.
        //escape special chars
      if(!redirectURI.match(new RegExp("^" + escapeRegExp(client.redirectURI) + ".*$"))){
          return done(new Error("redirect URI did not match."));
      }
      return done(null, client, redirectURI);
    });
  }),
  function(req, res){
    res.render('dialog', { transactionID: req.oauth2.transactionID, user: req.user, client: req.oauth2.client });
  }
];

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

// user decision endpoint
//
// `decision` middleware processes a user's decision to allow or deny access
// requested by a client application.  Based on the grant type requested by the
// client, the above grant middleware configured above will be invoked to send
// a response.

exports.decision = [
  login.ensureLoggedIn(),
  server.decision()
];


// token endpoint
//
// `token` middleware handles client requests to exchange authorization grants
// for access tokens.  Based on the grant type being exchanged, the above
// exchange middleware will be invoked to handle the request.  Clients must
// authenticate when making requests to this endpoint.

exports.token = [
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  server.token(),
  server.errorHandler()
];
