'use strict';

exports.discoveryAccountsGet = function(args, res, next) {
  /**
   * parameters expected in the args:
   * account (String)
   * accountSpace (String)
   * currency (String)
   * currencySpace (String)
   * publicKey (String)
   **/

var examples = {};
  
  examples['application/json'] = {
  "account_space" : "aeiou",
  "currency" : "aeiou",
  "publicKey" : "aeiou",
  "stewards" : [ {
    "email_notifications" : true,
    "publicKey" : "aeiou",
    "email" : "aeiou",
    "username" : "aeiou"
  } ],
  "account" : "aeiou",
  "currency_space" : "aeiou"
};
  

  
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
  
  
}
exports.syncAccountsGet = function(args, res, next) {
  /**
   * parameters expected in the args:
   * account (String)
   * accountSpace (String)
   * currency (String)
   * currencySpace (String)
   **/

var examples = {};
  
  examples['application/json'] = "";
  

  
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
  
  
}
exports.syncAccountsPost = function(args, res, next) {
  /**
   * parameters expected in the args:
   * createRequest (Accounts)
   **/

var examples = {};
  
  examples['application/json'] = {
  "id" : "aeiou",
  "ok" : true
};
  

  
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
  
  
}
exports.syncAccountsIdGet = function(args, res, next) {
  /**
   * parameters expected in the args:
   * id (String)
   **/

var examples = {};
  
  examples['application/json'] = "";
  

  
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
  
  
}
exports.syncAccountsIdPut = function(args, res, next) {
  /**
   * parameters expected in the args:
   * id (String)
   * rev (String)
   * accounts (Accounts)
   **/

var examples = {};
  
  examples['application/json'] = {
  "id" : "aeiou",
  "ok" : true
};
  

  
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
  
  
}
exports.syncAccountsDelete = function(args, res, next) {
  /**
   * parameters expected in the args:
   * id (String)
   **/

var examples = {};
  
  examples['application/json'] = {
  "id" : "aeiou",
  "ok" : true
};
  

  
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
  
  
}
