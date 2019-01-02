const util = require('../../helpers/util.helper');
const async = require('async');
const db = require('../../helpers/db.helper');
const crypto = require('../../helpers/crypto.helper');

exports.currenciesGet = function (req, res, next) {
    /**
     * parameters expected in the args:
     * stewardname (String)
     * namespace (String)
     * currency (String)
     * authorization (String)
     **/

    var examples = {};

    examples['application/json'] = "";

    var request = {};
    request.stewardname = req.swagger.params.stewardname.value;
    //request.namespace = req.swagger.params.namespace.value;
    request.currency = req.swagger.params.currency.value;
    request.publicKey = req.user.publicKey;

    currenciesGet(request, function (err, result) {
        res.setHeader('Content-Type', 'application/json');
        if (err) {
            // throw error
            examples['application/json'] = err;
            res.statusCode = util.setStatus(err);
            res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
        } else {
            res.end(result);
        }
    });
};

//when you get a specific currency if found it adds it to your known currencies.
const currenciesGet = function(request, currenciesGetCallback) {
    db.openmoney_bucket.get('currencies~' + request.currency.toLowerCase(), function(err, results) {
        if (err) {
            currenciesGetCallback(err);
        } else {
            if(results.value.private) {
              var error = {};
              error.status = 403;
              error.code = 2009;
              error.message = 'Cannot add a private currency.';
              currenciesGetCallback(error);
            } else {
              var task = {};

              task.updateBucket = function(callback){
                db.stewards_bucket.get("steward_bucket~" + crypto.getHash(request.publicKey), function (err, steward_bucket) {
                    if (err) {
                        callback(err);
                    } else {

                      if(steward_bucket.value.currencies.indexOf(results.value.id.toLowerCase()) === -1){
                        steward_bucket.value.currencies.push(results.value.id.toLowerCase());
                      }

                      //add stewards of currency to users stewards list
                      results.value.stewards.forEach(function(steward){
                        if(steward_bucket.value.stewards.indexOf(steward) === -1){
                          steward_bucket.value.stewards.push(steward);
                        }
                      });

                      db.stewards_bucket.replace("steward_bucket~" + crypto.getHash(request.publicKey), steward_bucket.value, {cas: steward_bucket.cas}, function (err, ok) {
                          if (err) {
                            if(err.code == 12){
                              task.updateBucket(callback);
                            } else {
                              callback(err);
                            }
                          } else {
                            callback(null, results.value);
                          }
                      });
                    }
                });
              };

              async.series(task, function(err, results){
                if(err){
                  currenciesGetCallback(err);
                } else {
                  currenciesGetCallback(null, results.updateBucket);
                }
              })
            }
        }
    });
};