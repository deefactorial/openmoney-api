'use strict';
var util            = require('util'),
    path            = require('path'),
    express         = require('express');

var app = express();
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session');
var CouchbaseStore = require('connect-couchbase')(session);
var couchbaseStore = new CouchbaseStore({
  bucket:"oauth2Server",               //optional
  host:"127.0.0.1:8091",          //optional
  connectionTimeout: 2000,        //optional
  operationTimeout: 2000,         //optional
  cachefile: '',                  //optional
  ttl: 86400,                     //optional
  prefix: 'sess'                  //optional
});

/*
 *          cachefile: ''
 *          ttl: 86400,
 *          prefix: 'sess',
 *          operationTimeout:2000,
 connectionTimeout:2000,*/

couchbaseStore.on('connect', function() {
  console.info("Couchbase Session store is ready for use");
});


couchbaseStore.on('disconnect', function() {
  console.error("An error occurred connecting to Couchbase Session Storage");
});

function getRandomstring(length){
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < length; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

if(typeof process.env.SESSION_SECRET == 'undefined'){
  process.env.SESSION_SECRET = getRandomstring(160);
}

app.use(session({
  store: couchbaseStore,
  secret: process.env.SESSION_SECRET,
  cookie: {maxAge:24*60*60*1000} //stay open for 1 day of inactivity
}));

app.use(require('morgan')('combined'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
require('./api/oauth2server/auth');

var site = require('./api/oauth2server/site')
    , oauth2 = require('./api/oauth2server/oauth2')
    , user = require('./api/oauth2server/user')
    , client = require('./api/oauth2server/client');

module.exports = app; // for testing

// Set the DEBUG environment variable to enable debug output
if(typeof process.env.DEBUG == 'undefined'){
  process.env.DEBUG = 'swagger-tools:*';
}


var config = {
  appRoot: __dirname, // required config
  swaggerSecurityHandlers: {
    oauth2Password: function(req, def, scopes, callback) {
      console.log('in oauth2Password (req:  + JSON.stringify(req.headers) + , def: ' + JSON.stringify(def) + ', scopes: ' + scopes + ')');
      callback(new Error("Not Implemented"));
    },
    oauth2ImplicitSecurity: function(req, def, scopes, callback) {
      console.log('in oauth2ImplicitSecurity (req:  + JSON.stringify(req.headers) + , def: ' + JSON.stringify(def) + ', scopes: ' + scopes + ')');
      callback(new Error("Not Implemented"));
    },
    oauth2ApplicationSecurity: function(req, def, scopes, callback) {
      console.log('in oauth2ApplicationSecurity (req:  + JSON.stringify(req.headers) + , def: ' + JSON.stringify(def) + ', scopes: ' + scopes + ')');
      callback(new Error("Not Implemented"));
    },
    oauth2AccessCodeSecurity: function(req, def, scopes, callback) {
      console.log('in oauth2AccessCodeSecurity (req:  + JSON.stringify(req.headers) + , def: ' + JSON.stringify(def) + ', scopes: ' + scopes + ')');
      callback(new Error("Not Implemented"));
    },
    apiKeySecurity: function(req, def, scopes, callback) {
      console.log('in apiKeySecurity (req: ' + JSON.stringify(req.headers) + ', def: ' + JSON.stringify(def) + ', scopes: ' + scopes + ')');
      passport.authenticate('bearer', function (err, user, info) {
        if (err) {
          callback(new Error('Error in passport authenticate'));
        } else if (!user) {
          callback(new Error('Failed to authenticate oAuth token'));
        } else {
          req.user = user;
          callback();
        }

      })(req, null, callback);
    },
    basicAuthenticationSecurity: function(req, def, scopes, callback){
      console.log('in basicAuthenticationSecurity (req: ' + JSON.stringify(req.headers) + ', def: ' + JSON.stringify(def) + ', scopes: ' + scopes + ')');
      passport.authenticate(['basic', 'oauth2-client-password'], function (err, user, info) {
        if (err) {
          callback(new Error('Error in passport authenticate'));
        } else if (!user) {
          callback(new Error('Failed to authenticate oAuth token'));
        } else {
          req.user = user;
          callback();
        }
      })(req, null, callback);
    }
  }
};


var swagger = require('swagger-tools');
var swaggerObject = require('./api/swagger/swagger.json'); // This assumes you're in the root of the swagger-tools

// Initialize the Swagger Middleware
swagger.initializeMiddleware(swaggerObject, function (middleware) {

  // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  app.use(middleware.swaggerMetadata());

  // Provide the security handlers
  app.use(middleware.swaggerSecurity(config.swaggerSecurityHandlers));

  app.use(function(err, req, res, next) {
    console.error("Security Error Middleware: " + JSON.stringify(err));
    if(err.statusCode == 403){
      var error = {};
      error.code = 1006;
      error.status = 403;
      error.message = 'Authorization Failed.';
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(error));
    }
  });

  // Validate Swagger requests
  app.use(middleware.swaggerValidator({
    validateResponse: true
  }));

  app.use(function(err, req, res, next) {
    console.error("Validation Error Middleware: " + JSON.stringify(err));
    if(err.code == 'SCHEMA_VALIDATION_FAILED'){
      var error = {};
      error.code = 1007;
      error.status = 403;
      error.message = err.results.errors[0].message;
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(error));
    }
  });

  // Bug preventing response validation from JSON.parse output.
  app.post('/V2/stewards/:stewardname/oauth/token', oauth2.token);

  app.use(function(err, req, res, next) {
    console.error("Validation Error Middleware: ", err);
    if(typeof err.originalResponse != "undefined"){
      var error = {};
      error.code = JSON.parse(err.originalResponse).error;
      error.status = 403;
      error.message = JSON.pare(err.originalResponse).error_description;
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(error));
    }
  });

  //use the security and request/response validation before processing the oauth end points.
  app.get('/V2/stewards/:stewardname/login', site.loginForm);
  app.post('/V2/stewards/:stewardname/login', site.login);
  app.get('/V2/stewards/:stewardname/logut', site.logout);
  app.get('/V2/stewards/:stewardname/account', site.account);
  app.get('/V2/stewards/:stewardname/dialog/authorize', oauth2.authorization);
  app.post('/V2/stewards/:stewardname/dialog/authorize/decision', oauth2.decision);

  // Route validated requests to appropriate controller
  app.use(middleware.swaggerRouter({useStubs: true, controllers: './api/controllers'}));

  // Serve the Swagger documents and Swagger UI
  //   http://localhost:3000/docs => Swagger UI
  //   http://localhost:3000/api-docs => Swagger document
  app.use(middleware.swaggerUi({
    apiDocs: '/api-docs',
    swaggerUi: '/docs'
  }));

  var port = process.env.PORT || 8080;
  app.listen(port, function() {
    console.log('The server is running on port:' + port);
  });

});
