'use strict';

exports.discoveryCurrenciesGet = function(args, res, next) {
  /**
   * parameters expected in the args:
   * currency (String)
   * currencySpace (String)
   **/

var examples = {};
  
  examples['application/json'] = {
  "currency" : "aeiou",
  "stewards" : [ {
    "email_notifications" : true,
    "publicKey" : "aeiou",
    "email" : "aeiou",
    "username" : "aeiou"
  } ],
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
exports.syncCurrenciesGet = function(args, res, next) {
  /**
   * parameters expected in the args:
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
exports.syncCurrenciesPost = function(args, res, next) {
  /**
   * parameters expected in the args:
   * createRequest (Currencies)
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
exports.syncCurrenciesIdGet = function(args, res, next) {
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
exports.syncCurrenciesIdPut = function(args, res, next) {
  /**
   * parameters expected in the args:
   * id (String)
   * rev (String)
   * currencies (Currencies)
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
exports.syncCurrenciesIdDelete = function(args, res, next) {
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
