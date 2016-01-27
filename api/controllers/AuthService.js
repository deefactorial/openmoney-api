'use strict';

exports.accountGet = function(args, res, next) {
  /**
   * parameters expected in the args:
   * stewardname (String)
   **/

var examples = {};
  

  
  res.end();
}
exports.loginGet = function(args, res, next) {
  /**
   * parameters expected in the args:
   * stewardname (String)
   **/

var examples = {};
  

  
  res.end();
}
exports.loginPost = function(args, res, next) {
  /**
   * parameters expected in the args:
   * stewardname (String)
   * authorization (String)
   **/

var examples = {};
  

  
  res.end();
}
exports.logoutPost = function(args, res, next) {
  /**
   * parameters expected in the args:
   * stewardname (String)
   **/

var examples = {};
  

  
  res.end();
}
exports.oauthApplicationPost = function(args, res, next) {
  /**
   * parameters expected in the args:
   * stewardname (String)
   * application (Application_request)
   * authorization (String)
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
   * stewardname (String)
   * responseType (String)
   * clientId (String)
   * redirectUri (String)
   * scopes (List)
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
exports.oauthAuthorizePost = function(args, res, next) {
  /**
   * parameters expected in the args:
   * stewardname (String)
   * oauthAuthorizeRequest (Oauth_authorize_request)
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
exports.oauthDialogeGet = function(args, res, next) {
  /**
   * parameters expected in the args:
   * stewardname (String)
   * clientId (String)
   * redirectUri (String)
   * scopes (List)
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
exports.oauthDialogePost = function(args, res, next) {
  /**
   * parameters expected in the args:
   * stewardname (String)
   * oauthAuthorizeRequest (Oauth_authorize_request)
   **/

var examples = {};
  
  examples['application/json'] = {
  "code" : 123,
  "message" : "aeiou"
};
  

  
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
  
  
}
exports.oauthAccessTokenPost = function(args, res, next) {
  /**
   * parameters expected in the args:
   * stewardname (String)
   * accessTokenRequest (Access_token_request)
   * authorization (String)
   **/

var examples = {};
  
  examples['application/json'] = {
  "expires" : "aeiou",
  "scope" : [ "aeiou" ],
  "token_type" : "aeiou",
  "token" : "aeiou"
};
  

  
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
  
  
}
