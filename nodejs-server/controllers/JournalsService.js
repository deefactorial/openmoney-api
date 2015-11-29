'use strict';

exports.syncJournalsGet = function(args, res, next) {
  /**
   * parameters expected in the args:
   * account (String)
   * accountSpace (String)
   * currency (String)
   * currencySpace (String)
   * offset (Integer)
   * range (Integer)
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
exports.syncJournalsPost = function(args, res, next) {
  /**
   * parameters expected in the args:
   * createRequest (Journals)
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
exports.syncJournalsIdGet = function(args, res, next) {
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
