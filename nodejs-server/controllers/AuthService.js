'use strict';

exports.accessTokenPost = function(args, res, next) {
  /**
   * parameters expected in the args:
   * accessTokenRequest (Access_token_request)
   **/

  var request = {};
  request.cors_token = args.access_token_request.value.cors_token;
  request.proof_token = args.access_token_request.value.proof_token;
  request.publicKey = args.access_token_request.value.publicKey;

  var MasterController = require('../../MasterController');
  MasterController.accessTokenPost(request, function (err, result) {
    if (err) {
      // throw error
      var examples = {};
      examples['application/json'] = err;

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
    } else {
      var examples = {};
      examples['application/json'] = result;

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
    }
  });
  
}
exports.authorizePost = function(args, res, next) {
  /**
   * parameters expected in the args:
   * authorizeRequest (Authorize_request)
   **/

//authorizePost

  var request = {};
  request.cors_token = args.authorize_request.value.cors_token;
  request.publicKey = args.authorize_request.value.publicKey;

  var MasterController = require('../../MasterController');
  MasterController.authorizePost(request, function (err, result) {
    if (err) {
      // throw error
      var examples = {};
      examples['application/json'] = err;

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
    } else {
      var examples = {};
      examples['application/json'] = result;

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
    }
  });
  
}
exports.oauthAccessTokenPost = function(args, res, next) {
  /**
   * parameters expected in the args:
   * accessTokenRequest (Access_token_request)
   **/

var examples = {};
  
  examples['application/json'] = {
  "access_token" : "aeiou",
  "scope" : [ "aeiou" ],
  "access_token_expiry" : 123456789,
  "token_type" : "aeiou"
};
  

  
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
  
  
}
exports.oauthApplicationPost = function(args, res, next) {
  /**
   * parameters expected in the args:
   * application (Application_request)
   **/

var examples = {};
  
  examples['application/json'] = {
  "application_secret" : "aeiou",
  "application_id" : "aeiou"
};
  

  
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
  
  
}
exports.oauthAuthorizeGet = function(args, res, next) {
  /**
   * parameters expected in the args:
   * applicationId (String)
   * corsToken (String)
   * redirectUri (String)
   * scope (List)
   **/

var examples = {};
  

  
  res.end();
}
exports.registerPost = function(args, res, next) {
  /**
   * parameters expected in the args:
   * registerRequest (Register_request)
   **/
//registerPost

  var MasterController = require('../../MasterController');

  var request = {};
  request.username = args.register_request.value.username;
  request.publicKey = args.register_request.value.publicKey;
  if( typeof args.register_request.value.email != 'undefined') {
    request.email = args.register_request.value.email;
  }
  if( typeof args.register_request.value.email_notifications != 'undefined') {
    request.email_notifications = args.register_request.value.email_notifications;
  }

  MasterController.registerPost(request, function(err, result){
    if(err) {
      // throw error
      var examples = {};
      examples['application/json'] = err;

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
    } else {
      var examples = {};
      examples['application/json'] = result;

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
    }
  })
  
}
exports.registerOptions = function(args, res, next) {
  /**
   * parameters expected in the args:
   **/

var examples = {};
  

  
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
  
  
}
