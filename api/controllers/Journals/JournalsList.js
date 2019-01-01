const util = require('../../helpers/util.helper');
const async = require('async');
const db = require('../../helpers/db.helper');
const crypto = require('../../helpers/crypto.helper');

exports.journalsList = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * account (String)
     * currency (string)
     * currency_namespace (string)
     * authorization (String)
     * offset (Integer)
     * range (Integer)
     **/

    var examples = {};

    examples['application/json'] = "";

    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    request.namespace = req.swagger.params.namespace.value;
    request.account = req.swagger.params.account.value;
    request.currency = req.swagger.params.currency.value;
    request.currency_namespace = req.swagger.params.currency_namespace.value;
    request.offset = req.swagger.params.offset.value;
    request.range = req.swagger.params.range.value;
    request.publicKey = req.user.publicKey;

    journalsList(request, function (err, result) {
        res.setHeader('Content-Type', 'application/json');
        if (err) {
            // throw error
            examples['application/json'] = err;
            res.statusCode = util.setStatus(err);
            res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
        } else {
            res.end(result)
        }
    });
};

const journalsList = function(request, journalsListCallback) {
    //request.stewardname = args.stewardname.value;
    //request.namespace = args.namespace.value;
    //request.account = args.account.value;
    //request.currency = args.currency.value;
    //request.currency_namespace = args.currency_namespace.value;
    //request.offset = args.offset.value;
    //request.range = args.range.value;
    //request.publicKey = publicKey;
    var currency;
    if(typeof request.currency != 'undefined'){
      currency = (typeof request.currency_namespace == 'undefined' || request.currency_namespace == '') ? request.currency.toLowerCase() : request.currency.toLowerCase() + '.' + request.currency_namespace.toLowerCase();
    }
    var journalList;
    if(typeof request.account != 'undefined' && request.namespace != 'undefined'){
      journalList = "journalsList~" + request.account.toLowerCase() + '.' + request.namespace.toLowerCase() + "~" + currency;
    }

    if(typeof journalList == 'undefined'){
      //get this stewards bucket, then get all their account journals.
      db.stewards_bucket.get("steward_bucket~" + crypto.getHash(request.publicKey), function(err,steward_bucket) {
          if(err) {
              accountsListCallback(err, false);
          } else {
              var parallelTasks = {};
              steward_bucket.value.accounts.forEach(function(accountID){
                var journalList = "journalsList~" + accountID.split('~')[1] + '~' + accountID.split('~')[2];
                parallelTasks[journalList] = function(callback){
                  getJournalList(request, journalList, function(err, journals){
                    if(err){
                      callback(err);
                    } else {
                      callback(null, journals);
                    }
                  })
                }
              });
              steward_bucket.value.currencies.forEach(function(currencyID){
                var journalList = "journalsList~" + currencyID.split('~')[1];
                parallelTasks[journalList] = function(callback){
                  db.openmoney_bucket.get(currencyID, function(err, currencyDoc){
                    if(err){
                      callback(err);
                    } else {

                      //only get the currency journals if your the steward of the currency
                      var isSteward = false;
                      currencyDoc.value.stewards.forEach(function(steward){
                        if(steward == 'stewards~' + request.stewardname.toLowerCase()){
                          isSteward = true;
                        }
                      })
                      if(isSteward){
                        getJournalList(request, journalList, function(err, journals){
                          if(err){
                            callback(err);
                          } else {
                            callback(null, journals);
                          }
                        })
                      } else {
                        callback(null, []);
                      }
                    }
                  });
                }
              })
              async.parallel(parallelTasks, function(err, results){
                if(err){
                  journalsListCallback(err);
                } else {
                  //agrigate results
                  var allJournals = [];

                  for (var k in results){
                    if (results.hasOwnProperty(k)) {
                      var journals = results[k];
                      for(i = 0; i < journals.length; i++){

                        //check if each each journal is unique in the result set
                        var unique = true;
                        for(var j = 0; j < allJournals.length; j++){
                          if(allJournals[j].id == journals[i].id){
                            unique = false;
                          }
                        }
                        if(unique){
                          allJournals.push(journals[i]);
                        }
                      }
                    }
                  }
                  journalsListCallback(null, allJournals);
                }
              })
          }
      });
    } else {
      getJournalList(request, journalList, function(err, journals){
        if(err){
          journalsListCallback(err);
        } else {
          journalsListCallback(null, journals);
        }
      })
    }

    //var N1qlQuery = couchbase.N1qlQuery;
    //db.stewards_bucket.enableN1ql(['http://127.0.0.1:8093/']);
    //var queryString = 'SELECT * FROM openmoney_stewards WHERE Meta().id like "' + crypto.getHash(request.publicKey) + 'journals~%";';
    //var query = N1qlQuery.fromString(queryString);
    //db.stewards_bucket.query(query, function(err, results) {
    //    if (err) {
    //        journalsListCallback(err,false);
    //    } else {
    //        var response = [];
    //        for(i in results) {
    //            response.push(results[i].openmoney_stewards);
    //        }
    //        journalsListCallback(null, response);
    //    }
    //});
};

function getJournalList(request, journalListDocID, callback){
  db.stewards_bucket.get(journalListDocID, function(err,journalList) {
      if(err) {
          if(err.code == 13){
            //there are no journal entries for this account
            callback(null, []);
          } else {
            callback(err);
          }
      } else {
          var parallelTasks = {};
          var count = 0;
          journalList.value.list.forEach(function(journalID){
              count++;
              var is_displayed = false;
              if(typeof request.offset != 'undefined' && typeof request.range != 'undefined') {
                  if(count >= request.offset && count < request.offset + request.range) {
                      is_displayed = true;
                  }
              } else {
                  is_displayed = true;
              }
              if(is_displayed) {
                  parallelTasks[journalID] = function (cb) {
                      db.stewards_bucket.get(crypto.getHash(request.publicKey) + journalID, function (err, journal) {
                          if (err) {
                              cb(null, null);
                          } else {
                              cb(null, journal.value);
                          }
                      })
                  };
              }
          });
          async.parallel(parallelTasks, function(err, results){
              if(err) {
                  callback(err);
              } else {
                  var response = [];
                  for (var key in results) {
                      if (results.hasOwnProperty(key)) {
                        if(results[key] != null){
                          response.push(results[key]);
                        }

                      }
                  }
                  callback(null, response);
              }
          });
      }
  });
}