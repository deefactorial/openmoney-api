'use strict';

exports.discoverySpacesGet = function(args, res, next) {
  /**
   * parameters expected in the args:
   * space (String)
   **/

var examples = {};
  
  examples['application/json'] = {
  "parent_space" : "aeiou",
  "stewards" : [ {
    "email_notifications" : true,
    "publicKey" : "aeiou",
    "email" : "aeiou",
    "username" : "aeiou"
  } ],
  "space" : "aeiou"
};
  

  
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
  
  
}
exports.syncSpacesGet = function(args, res, next) {
  /**
   * parameters expected in the args:
   * space (String)
   * spaceParent (String)
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
exports.syncSpacesPost = function(args, res, next) {
  /**
   * parameters expected in the args:
   * createRequest (Spaces)
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
exports.syncSpacesIdGet = function(args, res, next) {
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
exports.syncSpacesIdPut = function(args, res, next) {
  /**
   * parameters expected in the args:
   * id (String)
   * rev (String)
   * space (Spaces)
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
exports.syncSpacesIdDelete = function(args, res, next) {
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
